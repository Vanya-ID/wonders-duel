import type { GameMode, VictoryType } from '../domain/types'
import { hasAgora } from './modes'

export const VICTORY_LABELS: Record<VictoryType, string> = {
  civilian: 'Гражданская победа (по очкам)',
  military: 'Военное превосходство',
  science: 'Научное превосходство',
  political: 'Политическое превосходство',
}

export const VICTORY_SHORT: Record<VictoryType, string> = {
  civilian: 'по очкам',
  military: 'военная',
  science: 'научная',
  political: 'политическая',
}

export const instantVictoriesForMode = (mode: GameMode): VictoryType[] =>
  hasAgora(mode) ? ['military', 'science', 'political'] : ['military', 'science']
