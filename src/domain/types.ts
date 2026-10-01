export type GameMode = 'base' | 'pantheon' | 'agora' | 'both'

export type PlayerSlot = 'p1' | 'p2'

export type VictoryType = 'civilian' | 'military' | 'science' | 'political'

export type Winner = PlayerSlot | 'draw'

export type CategoryInput = 'points' | 'coins' | 'military' | 'temples' | 'senate'

export interface CategoryDef {
  id: string
  label: string
  hint?: string
  input: CategoryInput
  color: string
  modes: GameMode[]
}

export type ScoreValues = Record<string, number>

export interface Game {
  id: string
  playedAt: string
  mode: GameMode
  players: Record<PlayerSlot, string>
  victory: VictoryType
  winner: Winner
  scores: Record<PlayerSlot, ScoreValues> | null
  totals: Record<PlayerSlot, number> | null
}

export interface StoredGame extends Game {
  deletedAt: string | null
}

export const PLAYER_SLOTS: PlayerSlot[] = ['p1', 'p2']

export const otherSlot = (slot: PlayerSlot): PlayerSlot => (slot === 'p1' ? 'p2' : 'p1')
