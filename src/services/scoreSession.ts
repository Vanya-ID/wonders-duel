import type { SupabaseClient } from '@supabase/supabase-js'
import type { GameMode, PlayerSlot, ScoreValues } from '../domain/types'
import { newId } from './store'
import { supabase } from './supabase'

export interface Sheet {
  deviceId: string
  submitted: boolean
  values: ScoreValues
}

export type SessionStatus = 'open' | 'done' | 'cancelled'

export interface ScoreSession {
  id: string
  mode: GameMode
  status: SessionStatus
  sheet_p1: Sheet | null
  sheet_p2: Sheet | null
  created_at: string
}

const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000

const requireClient = (): SupabaseClient => {
  if (!supabase) {
    throw new Error('Синхронизация не настроена: не заданы ключи Supabase')
  }

  return supabase
}

export const sheetOf = (session: ScoreSession, slot: PlayerSlot): Sheet | null =>
  slot === 'p1' ? session.sheet_p1 : session.sheet_p2

const sheetColumn = (slot: PlayerSlot): 'sheet_p1' | 'sheet_p2' => (slot === 'p1' ? 'sheet_p1' : 'sheet_p2')

export const fetchOpenSession = async (): Promise<ScoreSession | null> => {
  const since = new Date(Date.now() - SESSION_MAX_AGE_MS).toISOString()
  const { data, error } = await requireClient()
    .from('score_sessions')
    .select('*')
    .eq('status', 'open')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as ScoreSession | null
}

export const fetchSession = async (id: string): Promise<ScoreSession | null> => {
  const { data, error } = await requireClient().from('score_sessions').select('*').eq('id', id).maybeSingle()

  if (error) {
    throw error
  }

  return data as ScoreSession | null
}

export const createSession = async (mode: GameMode): Promise<ScoreSession> => {
  const { data, error } = await requireClient()
    .from('score_sessions')
    .insert({ id: newId(), mode })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as ScoreSession
}

export const writeSheet = async (id: string, slot: PlayerSlot, sheet: Sheet | null): Promise<ScoreSession> => {
  const { data, error } = await requireClient()
    .from('score_sessions')
    .update({ [sheetColumn(slot)]: sheet })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as ScoreSession
}

export const setSessionStatus = async (id: string, status: SessionStatus): Promise<void> => {
  const { error } = await requireClient().from('score_sessions').update({ status }).eq('id', id)

  if (error) {
    throw error
  }
}

export const subscribeToSessions = (
  onChange: (session: ScoreSession) => void,
  onConnectionChange: (connected: boolean) => void,
): (() => void) => {
  const client = requireClient()
  const channel = client
    .channel(`score-sessions-${newId()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'score_sessions' }, (payload) => {
      const row = payload.new as Partial<ScoreSession>
      if (row.id) {
        onChange(row as ScoreSession)
      }
    })
    .subscribe((status, error) => {
      if (error) {
        console.error('Ошибка подписки на подсчёт', status, error)
      }
      onConnectionChange(status === 'SUBSCRIBED')
    })

  return () => {
    void client.removeChannel(channel)
  }
}
