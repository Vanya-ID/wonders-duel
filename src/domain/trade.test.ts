import { describe, expect, it } from 'vitest'
import { lineCost, unitPrice } from './trade'

describe('unitPrice', () => {
  it('costs 2 plus the opponent production', () => {
    expect(unitPrice({ opponentProduction: 0, fixedPrice: false, decreeDiscount: false })).toBe(2)
    expect(unitPrice({ opponentProduction: 3, fixedPrice: false, decreeDiscount: false })).toBe(5)
  })

  it('costs 1 with a fixed-price yellow card regardless of production', () => {
    expect(unitPrice({ opponentProduction: 4, fixedPrice: true, decreeDiscount: false })).toBe(1)
  })

  it('applies the Agora decree discount but never below 1', () => {
    expect(unitPrice({ opponentProduction: 2, fixedPrice: false, decreeDiscount: true })).toBe(3)
    expect(unitPrice({ opponentProduction: 0, fixedPrice: false, decreeDiscount: true })).toBe(1)
    expect(unitPrice({ opponentProduction: 0, fixedPrice: true, decreeDiscount: true })).toBe(1)
  })
})

describe('lineCost', () => {
  it('multiplies unit price by the number of units', () => {
    expect(lineCost({ needed: 2, opponentProduction: 1, fixedPrice: false, decreeDiscount: false })).toBe(6)
    expect(lineCost({ needed: 0, opponentProduction: 5, fixedPrice: false, decreeDiscount: false })).toBe(0)
  })
})
