import { describe, expect, it } from 'vitest'
import { computeStats } from './stats'
import type { Game, PlayerSlot, VictoryType, Winner } from './types'

let counter = 0

const game = (
  winner: Winner,
  options: { victory?: VictoryType; totals?: Record<PlayerSlot, number>; mode?: Game['mode'] } = {},
): Game => {
  counter += 1
  return {
    id: `g${counter}`,
    playedAt: `2026-10-${String(counter).padStart(2, '0')}T20:00:00.000Z`,
    mode: options.mode ?? 'base',
    players: { p1: 'Аня', p2: 'Ваня' },
    victory: options.victory ?? 'civilian',
    winner,
    scores: null,
    totals: options.totals ?? null,
  }
}

describe('computeStats', () => {
  it('returns empty stats for no games', () => {
    const stats = computeStats([])
    expect(stats.total).toBe(0)
    expect(stats.wins).toEqual({ p1: 0, p2: 0 })
    expect(stats.avgScore).toEqual({ p1: null, p2: null })
    expect(stats.currentStreak).toBeNull()
    expect(stats.bestScore).toBeNull()
  })

  it('counts wins, draws, modes and victory types', () => {
    counter = 0
    const stats = computeStats([
      game('p1', { totals: { p1: 60, p2: 50 } }),
      game('p2', { victory: 'military', mode: 'agora' }),
      game('draw', { totals: { p1: 55, p2: 55 } }),
      game('p2', { victory: 'science', mode: 'agora' }),
    ])

    expect(stats.total).toBe(4)
    expect(stats.draws).toBe(1)
    expect(stats.wins).toEqual({ p1: 1, p2: 2 })
    expect(stats.byMode).toEqual([
      { mode: 'base', total: 2, draws: 1, wins: { p1: 1, p2: 0 } },
      { mode: 'agora', total: 2, draws: 0, wins: { p1: 0, p2: 2 } },
    ])
    expect(stats.byVictory).toEqual([
      { victory: 'civilian', wins: { p1: 1, p2: 0 } },
      { victory: 'military', wins: { p1: 0, p2: 1 } },
      { victory: 'science', wins: { p1: 0, p2: 1 } },
    ])
  })

  it('averages scores only over games with totals', () => {
    counter = 0
    const stats = computeStats([
      game('p1', { totals: { p1: 70, p2: 50 } }),
      game('p2', { victory: 'military' }),
      game('p2', { totals: { p1: 40, p2: 61 } }),
    ])

    expect(stats.avgScore).toEqual({ p1: 55, p2: 55.5 })
    expect(stats.bestScore).toMatchObject({ slot: 'p1', value: 70 })
    expect(stats.biggestMargin).toMatchObject({ slot: 'p2', value: 21 })
  })

  it('tracks current and longest streaks in chronological order, draws break streaks', () => {
    counter = 0
    const g1 = game('p1')
    const g2 = game('p1')
    const g3 = game('p1')
    const g4 = game('draw')
    const g5 = game('p2')
    const g6 = game('p2')

    const stats = computeStats([g6, g1, g4, g3, g5, g2])

    expect(stats.longestStreak).toEqual({ p1: 3, p2: 2 })
    expect(stats.currentStreak).toEqual({ slot: 'p2', length: 2 })
  })

  it('resets current streak after a draw', () => {
    counter = 0
    const stats = computeStats([game('p1'), game('draw')])
    expect(stats.currentStreak).toBeNull()
    expect(stats.longestStreak).toEqual({ p1: 1, p2: 0 })
  })
})
