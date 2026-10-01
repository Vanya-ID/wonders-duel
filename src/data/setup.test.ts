import { describe, expect, it } from 'vitest'
import type { GameMode } from '../domain/types'
import { DRAFT_STEPS, cardsInLayout, layoutFor } from './setup'

const tokens = (mode: GameMode, age: 1 | 2 | 3, kind: 'mythology' | 'offering') =>
  layoutFor(mode, age).rows.flatMap((row) => Object.values(row.tokens ?? {})).filter((token) => token === kind).length

describe('layoutFor', () => {
  it('builds 20-card layouts without Agora', () => {
    for (const mode of ['base', 'pantheon'] as const) {
      expect([1, 2, 3].map((age) => cardsInLayout(layoutFor(mode, age as 1 | 2 | 3)))).toEqual([20, 20, 20])
    }
  })

  it('builds 25/25/23-card layouts with Agora', () => {
    for (const mode of ['agora', 'both'] as const) {
      expect([1, 2, 3].map((age) => cardsInLayout(layoutFor(mode, age as 1 | 2 | 3)))).toEqual([25, 25, 23])
    }
  })

  it('starts every layout with a face-up row and alternates', () => {
    const layout = layoutFor('base', 3)
    expect(layout.rows.map((row) => row.slots.find((slot) => slot !== 'gap'))).toEqual([
      'up',
      'down',
      'up',
      'down',
      'up',
      'down',
      'up',
    ])
  })

  it('places 5 Mythology tokens in Age I and 3 Offering tokens in Age II only with Pantheon', () => {
    for (const mode of ['pantheon', 'both'] as const) {
      expect(tokens(mode, 1, 'mythology')).toBe(5)
      expect(tokens(mode, 2, 'offering')).toBe(3)
      expect(tokens(mode, 3, 'mythology') + tokens(mode, 3, 'offering')).toBe(0)
    }
    for (const mode of ['base', 'agora'] as const) {
      expect(tokens(mode, 1, 'mythology') + tokens(mode, 2, 'offering')).toBe(0)
    }
  })

  it('puts tokens only on face-down cards', () => {
    for (const mode of ['pantheon', 'both'] as const) {
      for (const age of [1, 2] as const) {
        for (const row of layoutFor(mode, age).rows) {
          for (const index of Object.keys(row.tokens ?? {})) {
            expect(row.slots[Number(index)]).toBe('down')
          }
        }
      }
    }
  })
})

describe('DRAFT_STEPS', () => {
  it('gives each player 4 wonders', () => {
    const picked = { first: 0, second: 0 }
    for (const step of DRAFT_STEPS) {
      picked[step.picker] += step.count
    }
    expect(picked).toEqual({ first: 4, second: 4 })
  })
})
