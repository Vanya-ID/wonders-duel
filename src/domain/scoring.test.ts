import { describe, expect, it } from 'vitest'
import {
  buildCivilianGame,
  categoriesForMode,
  coinsToPoints,
  decideWinner,
  emptyValues,
  isChamberControlled,
  senateToPoints,
  templesToPoints,
  toggleChamber,
  totalPoints,
} from './scoring'
import type { ScoreValues } from './types'

const base = (values: ScoreValues): ScoreValues => ({ ...emptyValues('base'), ...values })

describe('coinsToPoints', () => {
  it('gives 1 point per full 3 coins', () => {
    expect(coinsToPoints(0)).toBe(0)
    expect(coinsToPoints(2)).toBe(0)
    expect(coinsToPoints(3)).toBe(1)
    expect(coinsToPoints(17)).toBe(5)
  })

  it('ignores negative input', () => {
    expect(coinsToPoints(-4)).toBe(0)
  })
})

describe('totalPoints', () => {
  it('sums all base categories converting coins', () => {
    const values = base({ blue: 20, green: 6, yellow: 4, guilds: 5, wonders: 12, progress: 3, coins: 14, military: 5 })
    expect(totalPoints('base', values)).toBe(20 + 6 + 4 + 5 + 12 + 3 + 4 + 5)
  })

  it('treats missing categories as zero', () => {
    expect(totalPoints('base', { blue: 7 })).toBe(7)
  })
})

describe('decideWinner', () => {
  it('picks the higher total', () => {
    expect(decideWinner('base', { p1: base({ blue: 30 }), p2: base({ blue: 25, wonders: 3 }) })).toBe('p1')
    expect(decideWinner('base', { p1: base({ blue: 10 }), p2: base({ green: 11 }) })).toBe('p2')
  })

  it('breaks a tie by civilian buildings', () => {
    const p1 = base({ blue: 12, wonders: 10 })
    const p2 = base({ blue: 15, wonders: 7 })
    expect(totalPoints('base', p1)).toBe(totalPoints('base', p2))
    expect(decideWinner('base', { p1, p2 })).toBe('p2')
  })

  it('returns draw when totals and civilian buildings are equal', () => {
    const p1 = base({ blue: 15, wonders: 7 })
    const p2 = base({ blue: 15, green: 7 })
    expect(decideWinner('base', { p1, p2 })).toBe('draw')
  })
})

describe('buildCivilianGame', () => {
  it('stores totals and winner', () => {
    const game = buildCivilianGame({
      id: 'g1',
      playedAt: '2026-10-01T20:00:00.000Z',
      mode: 'base',
      players: { p1: 'Аня', p2: 'Ваня' },
      scores: { p1: base({ blue: 20, coins: 9 }), p2: base({ blue: 21 }) },
    })
    expect(game.totals).toEqual({ p1: 23, p2: 21 })
    expect(game.winner).toBe('p1')
    expect(game.victory).toBe('civilian')
  })
})

describe('categoriesForMode', () => {
  const ids = (mode: Parameters<typeof categoriesForMode>[0]) => categoriesForMode(mode).map((c) => c.id)

  it('matches the official score pads', () => {
    expect(ids('base')).toEqual(['blue', 'green', 'yellow', 'guilds', 'wonders', 'progress', 'coins', 'military'])
    expect(ids('pantheon')).toEqual(['blue', 'green', 'yellow', 'temples', 'gods', 'wonders', 'progress', 'coins', 'military'])
    expect(ids('agora')).toEqual(['blue', 'green', 'yellow', 'guilds', 'wonders', 'progress', 'coins', 'military', 'senate'])
    expect(ids('both')).toEqual(['blue', 'green', 'yellow', 'temples', 'gods', 'wonders', 'progress', 'coins', 'military', 'senate'])
  })
})

describe('templesToPoints', () => {
  it('scores 1/2/3 Grand Temples as 5/12/21', () => {
    expect([0, 1, 2, 3].map(templesToPoints)).toEqual([0, 5, 12, 21])
  })
})

describe('senate', () => {
  it('scores controlled chambers 1-2-3-3-2-1 from left to right', () => {
    let mask = 0
    mask = toggleChamber(mask, 0)
    mask = toggleChamber(mask, 2)
    mask = toggleChamber(mask, 5)
    expect(isChamberControlled(mask, 2)).toBe(true)
    expect(isChamberControlled(mask, 3)).toBe(false)
    expect(senateToPoints(mask)).toBe(1 + 3 + 1)
    expect(senateToPoints(0b111111)).toBe(12)
  })

  it('toggling a chamber twice releases it', () => {
    expect(toggleChamber(toggleChamber(0, 4), 4)).toBe(0)
  })
})

describe('expansion totals', () => {
  it('counts temples, gods and senate in the both-expansions mode', () => {
    const values = { ...emptyValues('both'), blue: 10, temples: 2, gods: 9, senate: 0b000110, coins: 7 }
    expect(totalPoints('both', values)).toBe(10 + 12 + 9 + (2 + 3) + 2)
  })

  it('ignores guild points in Pantheon mode', () => {
    expect(totalPoints('pantheon', { blue: 5, guilds: 8 })).toBe(5)
  })
})
