import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createStore } from './store'
import { supabase } from './supabase'
import { syncNow } from './sync'

interface AuthState {
  ready: boolean
  user: User | null
}

export const authStore = createStore<AuthState>({ ready: !supabase, user: null })

const requireClient = (): SupabaseClient => {
  if (!supabase) {
    throw new Error('Синхронизация не настроена: не заданы ключи Supabase')
  }

  return supabase
}

const translateAuthError = (message: string): string => {
  if (/Invalid login credentials/i.test(message)) {
    return 'Неверный email или пароль'
  }
  if (/User already registered/i.test(message)) {
    return 'Пользователь с таким email уже зарегистрирован'
  }
  if (/Password should be at least/i.test(message)) {
    return 'Пароль должен быть не короче 6 символов'
  }
  if (/Email not confirmed/i.test(message)) {
    return 'Email не подтверждён — проверьте почту'
  }
  if (/Failed to fetch|NetworkError/i.test(message)) {
    return 'Сервер недоступен (нет сети или проект Supabase на паузе)'
  }
  return message
}

export const initAuth = (): void => {
  if (!supabase) {
    return
  }

  supabase.auth
    .getSession()
    .then(({ data, error }) => {
      if (error) {
        console.error('Ошибка получения сессии', error)
      }
      authStore.set({ ready: true, user: data.session?.user ?? null })
    })
    .catch((error: unknown) => {
      console.error('Ошибка получения сессии', error)
      authStore.set({ ready: true, user: null })
    })

  supabase.auth.onAuthStateChange((event, session) => {
    authStore.set({ ready: true, user: session?.user ?? null })
    if (event === 'SIGNED_IN') {
      setTimeout(() => void syncNow(), 0)
    }
  })
}

export const signUpWithPassword = async (email: string, password: string): Promise<boolean> => {
  const { data, error } = await requireClient().auth.signUp({ email, password })

  if (error) {
    throw new Error(translateAuthError(error.message))
  }

  return Boolean(data.session)
}

export const signInWithPassword = async (email: string, password: string): Promise<void> => {
  const { error } = await requireClient().auth.signInWithPassword({ email, password })

  if (error) {
    throw new Error(translateAuthError(error.message))
  }
}

export const signOut = async (): Promise<void> => {
  const { error } = await requireClient().auth.signOut()

  if (error) {
    throw new Error(translateAuthError(error.message))
  }
}
