import type { BackgroundId, PaletteId } from '../data/appearance'
import type { GameMode, PlayerSlot } from '../domain/types'
import { createStore, newId } from './store'

export type ThemeSetting = 'system' | 'light' | 'dark'

export interface Settings {
  players: Record<PlayerSlot, string>
  playersUpdatedAt: number
  deviceSlot: PlayerSlot | null
  lastMode: GameMode
  theme: ThemeSetting
  palette: PaletteId
  background: BackgroundId
  deviceId: string
}

export const settingsStore = createStore<Settings>(
  {
    players: { p1: 'Игрок 1', p2: 'Игрок 2' },
    playersUpdatedAt: 0,
    deviceSlot: null,
    lastMode: 'base',
    theme: 'system',
    palette: 'papyrus',
    background: 'none',
    deviceId: newId(),
  },
  'wonders-duel-settings',
)

export const updateSettings = (patch: Partial<Settings>): void => {
  settingsStore.update((prev) => ({ ...prev, ...patch }))
}

export const applyAppearance = (): void => {
  const { theme, palette, background } = settingsStore.get()
  const root = document.documentElement
  if (theme === 'system') {
    delete root.dataset.theme
  } else {
    root.dataset.theme = theme
  }
  root.dataset.palette = palette
  root.dataset.background = background
}
