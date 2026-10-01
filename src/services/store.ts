import { useSyncExternalStore } from 'react'

export interface Store<T> {
  get: () => T
  set: (next: T) => void
  update: (fn: (prev: T) => T) => void
  subscribe: (listener: () => void) => () => void
}

const readJson = <T>(key: string): Partial<T> | null => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as Partial<T>) : null
  } catch (error) {
    console.error(`Не удалось прочитать ${key} из localStorage`, error)
    return null
  }
}

const writeJson = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Не удалось записать ${key} в localStorage`, error)
  }
}

export const createStore = <T extends object>(initial: T, persistKey?: string): Store<T> => {
  let state: T = persistKey ? { ...initial, ...readJson<T>(persistKey) } : initial
  const listeners = new Set<() => void>()

  if (persistKey) {
    writeJson(persistKey, state)
  }

  const set = (next: T): void => {
    state = next
    if (persistKey) {
      writeJson(persistKey, next)
    }
    listeners.forEach((listener) => listener())
  }

  return {
    get: () => state,
    set,
    update: (fn) => set(fn(state)),
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export const useStore = <T>(store: Store<T>): T => useSyncExternalStore(store.subscribe, store.get)

export const newId = (): string => {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
