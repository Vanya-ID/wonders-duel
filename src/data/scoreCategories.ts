import type { CategoryDef, GameMode } from '../domain/types'

const ALL_MODES: GameMode[] = ['base', 'pantheon', 'agora', 'both']
const WITH_GUILDS: GameMode[] = ['base', 'agora']
const WITH_PANTHEON: GameMode[] = ['pantheon', 'both']
const WITH_AGORA: GameMode[] = ['agora', 'both']

export const SCORE_CATEGORIES: CategoryDef[] = [
  { id: 'blue', label: 'Синие карты', hint: 'гражданские здания', input: 'points', color: 'var(--card-blue)', modes: ALL_MODES },
  { id: 'green', label: 'Зелёные карты', hint: 'очки, напечатанные на научных зданиях', input: 'points', color: 'var(--card-green)', modes: ALL_MODES },
  { id: 'yellow', label: 'Жёлтые карты', hint: 'торговые здания', input: 'points', color: 'var(--card-yellow)', modes: ALL_MODES },
  { id: 'guilds', label: 'Гильдии', hint: 'фиолетовые карты', input: 'points', color: 'var(--card-purple)', modes: WITH_GUILDS },
  { id: 'temples', label: 'Великие Храмы', hint: 'сколько храмов построено', input: 'temples', color: 'var(--temple)', modes: WITH_PANTHEON },
  { id: 'gods', label: 'Боги', hint: 'Афродита — 9, Астарта — 1 за каждую монету на её карте', input: 'points', color: 'var(--god)', modes: WITH_PANTHEON },
  { id: 'wonders', label: 'Чудеса света', input: 'points', color: 'var(--accent)', modes: ALL_MODES },
  { id: 'progress', label: 'Жетоны Развития', hint: 'Земледелие, Философия, Математика, Мистицизм', input: 'points', color: 'var(--card-green)', modes: ALL_MODES },
  { id: 'coins', label: 'Монеты', hint: '1 очко за каждые 3 монеты в казне', input: 'coins', color: 'var(--coin)', modes: ALL_MODES },
  { id: 'military', label: 'Военные очки', hint: 'по зоне, где стоит маркер Конфликта', input: 'military', color: 'var(--card-red)', modes: ALL_MODES },
  { id: 'senate', label: 'Сенат', hint: 'отметьте Палаты под вашим контролем', input: 'senate', color: 'var(--senate)', modes: WITH_AGORA },
]

export const MILITARY_OPTIONS = [0, 2, 5, 10]

export const TEMPLE_POINTS = [0, 5, 12, 21]

export const SENATE_CHAMBER_POINTS = [1, 2, 3, 3, 2, 1]

export const TIEBREAK_CATEGORY = 'blue'
