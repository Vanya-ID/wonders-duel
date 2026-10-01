import { useCallback, useEffect, useRef, useState } from 'react'
import { buildCivilianGame, emptyValues } from '../../domain/scoring'
import type { GameMode, PlayerSlot, ScoreValues } from '../../domain/types'
import { PLAYER_SLOTS } from '../../domain/types'
import { authStore } from '../../services/auth'
import {
  createSession,
  fetchOpenSession,
  fetchSession,
  type ScoreSession,
  setSessionStatus,
  sheetOf,
  subscribeToSessions,
  writeSheet,
} from '../../services/scoreSession'
import { settingsStore, updateSettings } from '../../services/settings'
import { createStore, useStore } from '../../services/store'
import { isSupabaseConfigured } from '../../services/supabase'
import { addGame } from '../../services/sync'

export type ScorePhase = 'not-configured' | 'signed-out' | 'offline' | 'loading' | 'ready'

interface Draft {
  sessionId: string | null
  values: ScoreValues
}

const draftStore = createStore<Draft>({ sessionId: null, values: {} }, 'wonders-duel-score-draft')

const describeError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String((error as { message?: unknown })?.message ?? error)
  if (/Failed to fetch|NetworkError|aborted|timed out|TimeoutError/i.test(message)) {
    return 'Нет связи с базой. Проверьте интернет и попробуйте ещё раз.'
  }
  if (/relation .*score_sessions.* does not exist|schema cache/i.test(message)) {
    return 'Таблица score_sessions не найдена — выполните supabase/schema.sql в Supabase SQL Editor.'
  }
  return message
}

const useOnline = (): boolean => {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  return online
}

export const useScoreSession = () => {
  const auth = useStore(authStore)
  const settings = useStore(settingsStore)
  const draft = useStore(draftStore)
  const online = useOnline()
  const [session, setSession] = useState<ScoreSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const recordedRef = useRef(new Set<string>())

  useEffect(() => {
    sessionIdRef.current = session?.id ?? null
  }, [session])

  const canUse = isSupabaseConfigured && Boolean(auth.user) && online

  const refresh = useCallback(async () => {
    try {
      const currentId = sessionIdRef.current
      const current = currentId ? await fetchSession(currentId) : null
      if (current && current.status !== 'cancelled') {
        setSession(current)
        return
      }
      setSession(await fetchOpenSession())
    } catch (refreshError) {
      console.error('Ошибка загрузки подсчёта', refreshError)
      setError(describeError(refreshError))
    }
  }, [])

  useEffect(() => {
    if (!canUse) {
      return
    }

    let active = true
    void refresh().finally(() => {
      if (active) {
        setLoading(false)
      }
    })

    const unsubscribe = subscribeToSessions((row) => {
      setSession((prev) => {
        if (prev && row.id === prev.id) {
          return row.status === 'cancelled' ? null : row
        }
        if (!prev && row.status === 'open') {
          return row
        }
        return prev
      })
    }, setConnected)

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refresh()
      }
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      active = false
      unsubscribe()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [canUse, refresh])

  useEffect(() => {
    if (!session || session.status === 'cancelled') {
      return
    }
    const first = session.sheet_p1
    const second = session.sheet_p2
    if (!first?.submitted || !second?.submitted || recordedRef.current.has(session.id)) {
      return
    }

    recordedRef.current.add(session.id)
    addGame(
      buildCivilianGame({
        id: session.id,
        playedAt: session.created_at,
        mode: session.mode,
        players: settingsStore.get().players,
        scores: { p1: first.values, p2: second.values },
      }),
    )
    if (session.status === 'open') {
      setSessionStatus(session.id, 'done').catch((statusError: unknown) => {
        console.error('Не удалось закрыть подсчёт', statusError)
      })
    }
  }, [session])

  const mySlot: PlayerSlot | null = session
    ? (PLAYER_SLOTS.find((slot) => sheetOf(session, slot)?.deviceId === settings.deviceId) ?? null)
    : null

  const draftValues: ScoreValues =
    session && draft.sessionId === session.id ? { ...emptyValues(session.mode), ...draft.values } : session ? emptyValues(session.mode) : {}

  const run = async (action: () => Promise<void>): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (actionError) {
      console.error('Ошибка подсчёта', actionError)
      setError(describeError(actionError))
    } finally {
      setBusy(false)
    }
  }

  const start = (mode: GameMode) =>
    run(async () => {
      updateSettings({ lastMode: mode })
      const existing = await fetchOpenSession()
      setSession(existing ?? (await createSession(mode)))
    })

  const claim = (slot: PlayerSlot) =>
    run(async () => {
      if (!session) {
        return
      }
      const fresh = await fetchSession(session.id)
      if (!fresh || fresh.status === 'cancelled') {
        setSession(null)
        throw new Error('Этот подсчёт уже отменён')
      }
      const taken = sheetOf(fresh, slot)
      if (taken && taken.deviceId !== settings.deviceId) {
        throw new Error(`${settings.players[slot]} уже вводит очки на другом телефоне`)
      }
      if (mySlot && mySlot !== slot) {
        await writeSheet(session.id, mySlot, null)
      }
      const sheet = taken ?? { deviceId: settings.deviceId, submitted: false, values: emptyValues(fresh.mode) }
      setSession(await writeSheet(session.id, slot, sheet))
      updateSettings({ deviceSlot: slot })
    })

  const changeDraft = (values: ScoreValues) => {
    if (session) {
      draftStore.set({ sessionId: session.id, values })
    }
  }

  const submit = () =>
    run(async () => {
      if (!session || !mySlot) {
        return
      }
      setSession(
        await writeSheet(session.id, mySlot, { deviceId: settings.deviceId, submitted: true, values: draftValues }),
      )
    })

  const reopen = () =>
    run(async () => {
      if (!session || !mySlot) {
        return
      }
      const own = sheetOf(session, mySlot)
      if (own) {
        draftStore.set({ sessionId: session.id, values: own.values })
      }
      setSession(
        await writeSheet(session.id, mySlot, {
          deviceId: settings.deviceId,
          submitted: false,
          values: own?.values ?? draftValues,
        }),
      )
    })

  const cancel = () =>
    run(async () => {
      if (!session) {
        return
      }
      await setSessionStatus(session.id, 'cancelled')
      setSession(null)
    })

  const dismiss = () => {
    draftStore.set({ sessionId: null, values: {} })
    setSession(null)
    sessionIdRef.current = null
    void refresh()
  }

  const phase: ScorePhase = !isSupabaseConfigured
    ? 'not-configured'
    : !auth.ready
      ? 'loading'
      : !auth.user
        ? 'signed-out'
        : !online
          ? 'offline'
          : loading
            ? 'loading'
            : 'ready'

  return {
    phase,
    session,
    connected,
    busy,
    error,
    mySlot,
    draftValues,
    players: settings.players,
    lastMode: settings.lastMode,
    preferredSlot: settings.deviceSlot,
    start,
    claim,
    changeDraft,
    submit,
    reopen,
    cancel,
    dismiss,
  }
}
