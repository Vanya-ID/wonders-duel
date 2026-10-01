import type { SupabaseClient } from '@supabase/supabase-js'
import type { Game, PlayerSlot, StoredGame } from '../domain/types'
import { settingsStore, updateSettings } from './settings'
import { createStore } from './store'
import { supabase } from './supabase'

interface PendingOp {
  id: string
  op: 'insert' | 'delete'
}

interface GamesState {
  games: StoredGame[]
  pending: PendingOp[]
}

export type SyncStatus = 'local' | 'idle' | 'syncing' | 'error'

export interface SyncState {
  status: SyncStatus
  lastSyncAt: number | null
  error: string | null
}

interface GameRow {
  id: string
  played_at: string
  payload: Game
  deleted_at: string | null
}

interface RemotePlayers {
  names: Record<PlayerSlot, string>
  updatedAt: number
}

const SYNC_TIMEOUT_MS = 10000
const SYNC_DEBOUNCE_MS = 1000

export const gamesStore = createStore<GamesState>({ games: [], pending: [] }, 'wonders-duel-games')

export const syncStore = createStore<SyncState>({ status: 'local', lastSyncAt: null, error: null })

const setSyncState = (patch: Partial<SyncState>): void => {
  syncStore.update((prev) => ({ ...prev, ...patch }))
}

export const activeGames = (games: StoredGame[]): StoredGame[] => games.filter((game) => !game.deletedAt)

const withTimeout = <T>(promise: PromiseLike<T>, label: string): Promise<T> =>
  Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label}: превышено время ожидания`)), SYNC_TIMEOUT_MS),
    ),
  ])

const describeError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String((error as { message?: unknown })?.message ?? error)

  if (/Failed to fetch|NetworkError|время ожидания|aborted|timed out|TimeoutError/i.test(message)) {
    return 'База данных недоступна (нет сети или проект Supabase на паузе). Партии сохранены на этом устройстве.'
  }

  if (/relation .*games.* does not exist|schema cache/i.test(message)) {
    return 'Таблица games не найдена — выполните supabase/schema.sql в Supabase SQL Editor.'
  }

  return message
}

const toRow = ({ deletedAt, ...game }: StoredGame): GameRow => ({
  id: game.id,
  played_at: game.playedAt,
  payload: game,
  deleted_at: deletedAt,
})

const fromRow = (row: GameRow): StoredGame => ({ ...row.payload, id: row.id, deletedAt: row.deleted_at })

const mergeRemote = (local: GamesState, rows: GameRow[]): GamesState => {
  const pendingIds = new Set(local.pending.map((op) => op.id))
  const localById = new Map(local.games.map((game) => [game.id, game]))
  const remoteIds = new Set(rows.map((row) => row.id))

  const fromRemote = rows.map((row) => {
    const localGame = localById.get(row.id)
    return localGame && pendingIds.has(row.id) ? localGame : fromRow(row)
  })
  const unpushed = local.games.filter((game) => pendingIds.has(game.id) && !remoteIds.has(game.id))

  return { games: [...fromRemote, ...unpushed], pending: local.pending }
}

const pushGames = async (client: SupabaseClient): Promise<void> => {
  const { games, pending } = gamesStore.get()
  if (pending.length === 0) {
    return
  }

  const rowsFor = (op: PendingOp['op']): GameRow[] =>
    pending
      .filter((p) => p.op === op)
      .flatMap((p) => games.filter((game) => game.id === p.id))
      .map(toRow)

  const inserts = rowsFor('insert')
  if (inserts.length > 0) {
    const { error } = await withTimeout(
      client.from('games').upsert(inserts, { onConflict: 'id', ignoreDuplicates: true }),
      'Отправка партий',
    )
    if (error) {
      throw error
    }
  }

  const deletes = rowsFor('delete')
  if (deletes.length > 0) {
    const { error } = await withTimeout(client.from('games').upsert(deletes, { onConflict: 'id' }), 'Удаление партий')
    if (error) {
      throw error
    }
  }

  const pushed = new Set(pending)
  gamesStore.update((prev) => ({ ...prev, pending: prev.pending.filter((op) => !pushed.has(op)) }))
}

const pullGames = async (client: SupabaseClient): Promise<void> => {
  const { data, error } = await withTimeout(
    client.from('games').select('id, played_at, payload, deleted_at'),
    'Загрузка партий',
  )
  if (error) {
    throw error
  }

  gamesStore.update((prev) => mergeRemote(prev, data as GameRow[]))
}

const syncPlayerNames = async (client: SupabaseClient): Promise<void> => {
  const { data, error } = await withTimeout(client.auth.getUser(), 'Загрузка имён игроков')
  if (error) {
    throw error
  }

  const remote = data.user.user_metadata?.players as RemotePlayers | undefined
  const local = settingsStore.get()

  if (remote && remote.updatedAt > local.playersUpdatedAt) {
    updateSettings({ players: remote.names, playersUpdatedAt: remote.updatedAt })
    return
  }

  if (local.playersUpdatedAt > (remote?.updatedAt ?? 0)) {
    const players: RemotePlayers = { names: local.players, updatedAt: local.playersUpdatedAt }
    const { error: updateError } = await withTimeout(
      client.auth.updateUser({ data: { players } }),
      'Сохранение имён игроков',
    )
    if (updateError) {
      throw updateError
    }
  }
}

const runSync = async (): Promise<void> => {
  if (!supabase) {
    setSyncState({ status: 'local', error: null })
    return
  }

  try {
    const { data } = await withTimeout(supabase.auth.getSession(), 'Проверка сессии')
    if (!data.session) {
      setSyncState({ status: 'local', error: null })
      return
    }

    setSyncState({ status: 'syncing', error: null })
    await pushGames(supabase)
    await pullGames(supabase)
    await syncPlayerNames(supabase)
    setSyncState({ status: 'idle', lastSyncAt: Date.now(), error: null })
  } catch (error) {
    console.error('Ошибка синхронизации', error)
    setSyncState({ status: 'error', error: describeError(error) })
  }
}

let inflight: Promise<void> | null = null
let rerunRequested = false
let debounceTimer: ReturnType<typeof setTimeout> | null = null

export const syncNow = (): Promise<void> => {
  if (inflight) {
    rerunRequested = true
    return inflight
  }

  inflight = runSync().finally(() => {
    inflight = null
    if (rerunRequested) {
      rerunRequested = false
      void syncNow()
    }
  })
  return inflight
}

export const scheduleSync = (): void => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    void syncNow()
  }, SYNC_DEBOUNCE_MS)
}

export const startAutoSync = (): void => {
  window.addEventListener('online', () => void syncNow())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void syncNow()
    }
  })
  void syncNow()
}

export const addGame = (game: Game): void => {
  gamesStore.update((prev) =>
    prev.games.some((g) => g.id === game.id)
      ? prev
      : {
          games: [...prev.games, { ...game, deletedAt: null }],
          pending: [...prev.pending, { id: game.id, op: 'insert' }],
        },
  )
  scheduleSync()
}

export const deleteGame = (id: string): void => {
  const deletedAt = new Date().toISOString()
  gamesStore.update((prev) => ({
    games: prev.games.map((game) => (game.id === id ? { ...game, deletedAt } : game)),
    pending: [...prev.pending, { id, op: 'delete' }],
  }))
  scheduleSync()
}

export const renamePlayers = (players: Record<PlayerSlot, string>): void => {
  updateSettings({ players, playersUpdatedAt: Date.now() })
  scheduleSync()
}
