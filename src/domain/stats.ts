import type { Game, GameMode, PlayerSlot, VictoryType } from './types'
import { PLAYER_SLOTS } from './types'

type SlotCounts = Record<PlayerSlot, number>

export interface ModeStats {
  mode: GameMode
  total: number
  draws: number
  wins: SlotCounts
}

export interface VictoryStats {
  victory: VictoryType
  wins: SlotCounts
}

export interface ScoreRecord {
  slot: PlayerSlot
  value: number
  game: Game
}

export interface Streak {
  slot: PlayerSlot
  length: number
}

export interface Stats {
  total: number
  draws: number
  wins: SlotCounts
  byMode: ModeStats[]
  byVictory: VictoryStats[]
  avgScore: Record<PlayerSlot, number | null>
  bestScore: ScoreRecord | null
  biggestMargin: ScoreRecord | null
  currentStreak: Streak | null
  longestStreak: SlotCounts
}

const MODE_ORDER: GameMode[] = ['base', 'pantheon', 'agora', 'both']
const VICTORY_ORDER: VictoryType[] = ['civilian', 'military', 'science', 'political']

const zero = (): SlotCounts => ({ p1: 0, p2: 0 })

export const sortByPlayedAt = <T extends Game>(games: T[]): T[] =>
  [...games].sort((a, b) => a.playedAt.localeCompare(b.playedAt))

export const computeStats = (games: Game[]): Stats => {
  const ordered = sortByPlayedAt(games)
  const wins = zero()
  let draws = 0
  const byMode = new Map<GameMode, ModeStats>()
  const byVictory = new Map<VictoryType, VictoryStats>()
  const scoreSums = zero()
  const scoreCounts = zero()
  let bestScore: ScoreRecord | null = null
  let biggestMargin: ScoreRecord | null = null
  const longestStreak = zero()
  let currentStreak: Streak | null = null

  for (const game of ordered) {
    const modeStats = byMode.get(game.mode) ?? { mode: game.mode, total: 0, draws: 0, wins: zero() }
    modeStats.total += 1
    byMode.set(game.mode, modeStats)

    if (game.winner === 'draw') {
      draws += 1
      modeStats.draws += 1
      currentStreak = null
    } else {
      const winner = game.winner
      wins[winner] += 1
      modeStats.wins[winner] += 1

      const victoryStats = byVictory.get(game.victory) ?? { victory: game.victory, wins: zero() }
      victoryStats.wins[winner] += 1
      byVictory.set(game.victory, victoryStats)

      const previous: Streak | null = currentStreak
      const length: number = previous?.slot === winner ? previous.length + 1 : 1
      currentStreak = { slot: winner, length }
      longestStreak[winner] = Math.max(longestStreak[winner], length)
    }

    if (game.totals) {
      for (const slot of PLAYER_SLOTS) {
        const value = game.totals[slot]
        scoreSums[slot] += value
        scoreCounts[slot] += 1
        if (!bestScore || value > bestScore.value) {
          bestScore = { slot, value, game }
        }
      }

      if (game.winner !== 'draw') {
        const loser: PlayerSlot = game.winner === 'p1' ? 'p2' : 'p1'
        const margin = game.totals[game.winner] - game.totals[loser]
        if (!biggestMargin || margin > biggestMargin.value) {
          biggestMargin = { slot: game.winner, value: margin, game }
        }
      }
    }
  }

  const avg = (slot: PlayerSlot): number | null =>
    scoreCounts[slot] > 0 ? scoreSums[slot] / scoreCounts[slot] : null

  return {
    total: ordered.length,
    draws,
    wins,
    byMode: MODE_ORDER.flatMap((mode) => byMode.get(mode) ?? []),
    byVictory: VICTORY_ORDER.flatMap((victory) => byVictory.get(victory) ?? []),
    avgScore: { p1: avg('p1'), p2: avg('p2') },
    bestScore,
    biggestMargin,
    currentStreak,
    longestStreak,
  }
}
