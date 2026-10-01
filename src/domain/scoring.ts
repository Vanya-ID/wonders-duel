import { SCORE_CATEGORIES, SENATE_CHAMBER_POINTS, TEMPLE_POINTS, TIEBREAK_CATEGORY } from '../data/scoreCategories'
import type { CategoryDef, Game, GameMode, PlayerSlot, ScoreValues, Winner } from './types'

export const coinsToPoints = (coins: number): number => Math.floor(Math.max(0, coins) / 3)

export const templesToPoints = (count: number): number =>
  TEMPLE_POINTS[Math.min(TEMPLE_POINTS.length - 1, Math.max(0, count))]

export const isChamberControlled = (mask: number, chamber: number): boolean => (mask & (1 << chamber)) !== 0

export const toggleChamber = (mask: number, chamber: number): number => mask ^ (1 << chamber)

export const senateToPoints = (mask: number): number =>
  SENATE_CHAMBER_POINTS.reduce((sum, points, chamber) => sum + (isChamberControlled(mask, chamber) ? points : 0), 0)

export const categoriesForMode = (mode: GameMode): CategoryDef[] =>
  SCORE_CATEGORIES.filter((category) => category.modes.includes(mode))

export const categoryPoints = (category: CategoryDef, raw: number): number => {
  switch (category.input) {
    case 'coins':
      return coinsToPoints(raw)
    case 'temples':
      return templesToPoints(raw)
    case 'senate':
      return senateToPoints(raw)
    default:
      return raw
  }
}

export const totalPoints = (mode: GameMode, values: ScoreValues): number =>
  categoriesForMode(mode).reduce((sum, category) => sum + categoryPoints(category, values[category.id] ?? 0), 0)

export const emptyValues = (mode: GameMode): ScoreValues =>
  Object.fromEntries(categoriesForMode(mode).map((category) => [category.id, 0]))

export const decideWinner = (mode: GameMode, scores: Record<PlayerSlot, ScoreValues>): Winner => {
  const p1 = totalPoints(mode, scores.p1)
  const p2 = totalPoints(mode, scores.p2)
  if (p1 !== p2) {
    return p1 > p2 ? 'p1' : 'p2'
  }

  const tie1 = scores.p1[TIEBREAK_CATEGORY] ?? 0
  const tie2 = scores.p2[TIEBREAK_CATEGORY] ?? 0
  if (tie1 !== tie2) {
    return tie1 > tie2 ? 'p1' : 'p2'
  }

  return 'draw'
}

interface CivilianGameInput {
  id: string
  playedAt: string
  mode: GameMode
  players: Record<PlayerSlot, string>
  scores: Record<PlayerSlot, ScoreValues>
}

export const buildCivilianGame = ({ id, playedAt, mode, players, scores }: CivilianGameInput): Game => ({
  id,
  playedAt,
  mode,
  players,
  victory: 'civilian',
  winner: decideWinner(mode, scores),
  scores,
  totals: { p1: totalPoints(mode, scores.p1), p2: totalPoints(mode, scores.p2) },
})
