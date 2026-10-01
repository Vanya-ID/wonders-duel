import type { GameMode, PlayerSlot } from '../domain/types'
import { createStore, newId } from './store'

export type ThemeSetting = 'system' | 'light' | 'dark'

export interface Settings {
  players: Record<PlayerSlot, string>
  playersUpdatedAt: number
  deviceSlot: PlayerSlot | null
  lastMode: GameMode
  theme: ThemeSetting
  deviceId: string
}

export const settingsStore = createStore<Settings>(
  {
    players: { p1: 'Игрок 1', p2: 'Игрок 2' },
    playersUpdatedAt: 0,
    deviceSlot: null,
    lastMode: 'base',
    theme: 'system',
    deviceId: newId(),
  },
  'wonders-duel-settings',
)

export const updateSettings = (patch: Partial<Settings>): void => {
  settingsStore.update((prev) => ({ ...prev, ...patch }))
}

export const applyTheme = (theme: ThemeSetting): void => {
  if (theme === 'system') {
    delete document.documentElement.dataset.theme
  } else {
    document.documentElement.dataset.theme = theme
  }
}

export const playerName = (slot: PlayerSlot): string => settingsStore.get().players[slot]
