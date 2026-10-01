import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

const REQUEST_TIMEOUT_MS = 8000

const fetchWithTimeout: typeof fetch = (input, init) => {
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  const signal = init?.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal

  return fetch(input, { ...init, signal })
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: fetchWithTimeout },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: window.localStorage,
        storageKey: 'wonders-duel-auth',
      },
    })
  : null

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase не настроен: нет VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
      'История хранится только на этом устройстве, подсчёт на двух телефонах недоступен.',
  )
}
