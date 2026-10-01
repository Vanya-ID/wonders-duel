import type { GameMode } from '../domain/types'

export interface ModeDef {
  id: GameMode
  label: string
  short: string
}

export const MODES: ModeDef[] = [
  { id: 'base', label: 'База', short: 'База' },
  { id: 'pantheon', label: 'База + Пантеон', short: 'Пантеон' },
  { id: 'agora', label: 'База + Агора', short: 'Агора' },
  { id: 'both', label: 'База + Пантеон + Агора', short: 'Оба допа' },
]

export const modeLabel = (mode: GameMode): string => MODES.find((m) => m.id === mode)?.label ?? mode

export const hasPantheon = (mode: GameMode): boolean => mode === 'pantheon' || mode === 'both'

export const hasAgora = (mode: GameMode): boolean => mode === 'agora' || mode === 'both'
