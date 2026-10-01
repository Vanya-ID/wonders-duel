export type Resource = 'wood' | 'clay' | 'stone' | 'glass' | 'papyrus'

export const RESOURCES: { id: Resource; label: string; brown: boolean }[] = [
  { id: 'wood', label: 'Древесина', brown: true },
  { id: 'clay', label: 'Глина', brown: true },
  { id: 'stone', label: 'Камень', brown: true },
  { id: 'glass', label: 'Стекло', brown: false },
  { id: 'papyrus', label: 'Папирус', brown: false },
]

export interface TradeLine {
  needed: number
  opponentProduction: number
  fixedPrice: boolean
  decreeDiscount: boolean
}

export const unitPrice = ({ opponentProduction, fixedPrice, decreeDiscount }: Omit<TradeLine, 'needed'>): number =>
  fixedPrice ? 1 : Math.max(1, 2 + Math.max(0, opponentProduction) - (decreeDiscount ? 1 : 0))

export const lineCost = (line: TradeLine): number => line.needed * unitPrice(line)
