import type { GameMode } from '../domain/types'
import { hasAgora, hasPantheon } from './modes'

const ALL: GameMode[] = ['base', 'pantheon', 'agora', 'both']
const NO_AGORA: GameMode[] = ['base', 'pantheon']
const NO_PANTHEON: GameMode[] = ['base', 'agora']
const WITH_PANTHEON: GameMode[] = ['pantheon', 'both']
const WITH_AGORA: GameMode[] = ['agora', 'both']

export interface SetupStep {
  id: string
  text: string
  modes: GameMode[]
}

export type SetupPhaseKind = 'steps' | 'draft' | 'age'

export interface SetupPhase {
  id: string
  title: string
  kind: SetupPhaseKind
  age?: 1 | 2 | 3
  steps: SetupStep[]
}

const AGE_START_RULE =
  'Кто начинает: игрок, на чьей стороне поля стоит маркер Конфликта, выбирает, кто ходит первым. Маркер посередине — первым ходит тот, кто сыграл последнюю карту прошлой Эпохи.'

export const SETUP_PHASES: SetupPhase[] = [
  {
    id: 'table',
    title: 'Стол',
    kind: 'steps',
    steps: [
      { id: 'board', modes: ALL, text: 'Положите игровое поле между игроками, маркер Конфликта — на нейтральное деление посередине.' },
      { id: 'military-base', modes: NO_AGORA, text: '4 Военных жетона лицом вверх: «2» — ближе к центру, «5» — ближе к столицам.' },
      { id: 'military-agora', modes: WITH_AGORA, text: 'Военные жетоны «Агоры» вместо базовых: «+1 кубик» — на места жетонов «2», «убрать + переместить» — на места жетонов «5».' },
      { id: 'progress-base', modes: ['base'], text: 'Перемешайте 10 жетонов Развития, 5 случайных — лицом вверх на поле, остальные — в коробку.' },
      { id: 'progress-pantheon', modes: ['pantheon'], text: 'Перемешайте 13 жетонов Развития (10 + 3 «Пантеона»), 5 случайных — лицом вверх на поле, остальные — в коробку.' },
      { id: 'progress-agora', modes: ['agora'], text: 'Перемешайте 12 жетонов Развития (10 + 2 «Агоры»), 5 случайных — лицом вверх на поле, остальные — в коробку.' },
      { id: 'progress-both', modes: ['both'], text: 'Перемешайте 15 жетонов Развития (10 + 3 «Пантеона» + 2 «Агоры»), 5 случайных — лицом вверх на поле, остальные — в коробку.' },
      { id: 'coins', modes: ALL, text: 'Каждому игроку — 7 монет из банка.' },
      { id: 'pantheon-board', modes: WITH_PANTHEON, text: 'Поле Пантеона — над основным полем. Разделите карты богов по Мифологиям и перемешайте каждую стопку отдельно — 5 стопок рядом с полем.' },
      { id: 'pantheon-parts', modes: WITH_PANTHEON, text: 'Рядом с полем Пантеона: 3 жетона Жертвоприношения, карта Врат, жетон Змеи, фишка Минервы.' },
      { id: 'senate', modes: WITH_AGORA, text: 'Поле Сената — под основным полем. Каждый берёт 12 кубиков Влияния своего цвета.' },
      { id: 'decrees', modes: WITH_AGORA, text: 'Перемешайте 16 Декретов и положите по одному в каждую Палату: в Палаты 1, 3, 5 (считая слева) — лицом вверх, в 2, 4, 6 — лицом вниз, как показано на поле. Остальные 10 — в коробку не глядя.' },
      { id: 'conspiracies', modes: WITH_AGORA, text: 'Перемешайте колоду Заговоров и положите лицом вниз рядом с Сенатом.' },
    ],
  },
  {
    id: 'decks',
    title: 'Колоды Эпох',
    kind: 'steps',
    steps: [
      { id: 'remove', modes: ALL, text: 'Из каждой колоды Эпох (I, II, III) уберите в коробку не глядя по 3 карты.' },
      { id: 'guilds', modes: NO_PANTHEON, text: 'Не глядя возьмите 3 Гильдии и замешайте в колоду Эпохи III. Остальные Гильдии — в коробку.' },
      { id: 'temples', modes: WITH_PANTHEON, text: 'Все Гильдии — в коробку, они не используются. Не глядя возьмите 3 Великих Храма и замешайте в колоду Эпохи III, остальные Храмы — в коробку.' },
      { id: 'senators', modes: WITH_AGORA, text: 'Перемешайте 13 Сенаторов и добавьте не глядя: 5 — в колоду Эпохи I, 5 — в Эпоху II, 3 — в Эпоху III. Перемешайте каждую колоду.' },
      { id: 'count-base', modes: ['base'], text: 'Проверка: Эпоха I — 20 карт, Эпоха II — 20, Эпоха III — 20 (17 + 3 Гильдии).' },
      { id: 'count-pantheon', modes: ['pantheon'], text: 'Проверка: Эпоха I — 20 карт, Эпоха II — 20, Эпоха III — 20 (17 + 3 Великих Храма).' },
      { id: 'count-agora', modes: ['agora'], text: 'Проверка: Эпоха I — 25 карт, Эпоха II — 25, Эпоха III — 23 (17 + 3 Гильдии + 3 Сенатора).' },
      { id: 'count-both', modes: ['both'], text: 'Проверка: Эпоха I — 25 карт, Эпоха II — 25, Эпоха III — 23 (17 + 3 Великих Храма + 3 Сенатора).' },
    ],
  },
  {
    id: 'wonders',
    title: 'Чудеса света',
    kind: 'draft',
    steps: [
      { id: 'shuffle-base', modes: ['base'], text: 'Перемешайте 12 Чудес света.' },
      { id: 'shuffle-pantheon', modes: ['pantheon'], text: 'Перемешайте 14 Чудес света (12 + Святилище и Божественный театр).' },
      { id: 'shuffle-agora', modes: ['agora'], text: 'Перемешайте 14 Чудес света (12 + Курия Юлия и Кносский дворец).' },
      { id: 'shuffle-both', modes: ['both'], text: 'Перемешайте 16 Чудес света (12 + 2 «Пантеона» + 2 «Агоры»).' },
      { id: 'on-pick', modes: WITH_AGORA, text: 'Курия Юлия и Кносский дворец срабатывают уже при выборе — сразу примените их эффект «при выборе».' },
    ],
  },
  {
    id: 'age1',
    title: 'Эпоха I',
    kind: 'age',
    age: 1,
    steps: [
      { id: 'layout', modes: ALL, text: 'Разложите карты Эпохи I по схеме.' },
      { id: 'mythology', modes: WITH_PANTHEON, text: 'Не глядя положите 5 случайных жетонов Мифологии на отмеченные карты, затем переверните жетоны лицом вверх. Остальные — в коробку.' },
      { id: 'first', modes: ALL, text: 'Эпоху I начинает первый игрок.' },
    ],
  },
  {
    id: 'age2',
    title: 'Эпоха II',
    kind: 'age',
    age: 2,
    steps: [
      { id: 'start', modes: ALL, text: AGE_START_RULE },
      { id: 'gate', modes: WITH_PANTHEON, text: 'Карту Врат — лицом вверх в пустой слот Пантеона. Откройте карты богов в слотах.' },
      { id: 'layout', modes: ALL, text: 'Разложите карты Эпохи II по схеме.' },
      { id: 'offering', modes: WITH_PANTHEON, text: 'Не глядя положите 3 жетона Жертвоприношения на отмеченные карты, затем переверните их.' },
      { id: 'pantheon-action', modes: WITH_PANTHEON, text: 'С этой Эпохи вместо карты из раскладки можно активировать карту из Пантеона.' },
    ],
  },
  {
    id: 'age3',
    title: 'Эпоха III',
    kind: 'age',
    age: 3,
    steps: [
      { id: 'start', modes: ALL, text: AGE_START_RULE },
      { id: 'layout', modes: ALL, text: 'Разложите карты Эпохи III по схеме.' },
    ],
  },
]

export const stepsForMode = (phase: SetupPhase, mode: GameMode): SetupStep[] =>
  phase.steps.filter((step) => step.modes.includes(mode))

export type DraftPicker = 'first' | 'second'

export interface DraftStep {
  round: 1 | 2
  picker: DraftPicker
  count: 1 | 2
  last: boolean
}

export const DRAFT_STEPS: DraftStep[] = [
  { round: 1, picker: 'first', count: 1, last: false },
  { round: 1, picker: 'second', count: 2, last: false },
  { round: 1, picker: 'first', count: 1, last: true },
  { round: 2, picker: 'second', count: 1, last: false },
  { round: 2, picker: 'first', count: 2, last: false },
  { round: 2, picker: 'second', count: 1, last: true },
]

export type CardSlot = 'up' | 'down' | 'gap'

export type TokenKind = 'mythology' | 'offering'

export interface LayoutRow {
  slots: CardSlot[]
  tokens?: Partial<Record<number, TokenKind>>
}

export interface AgeLayout {
  age: 1 | 2 | 3
  rows: LayoutRow[]
}

const row = (count: number, faceUp: boolean, tokens?: LayoutRow['tokens']): LayoutRow => ({
  slots: Array.from({ length: count }, () => (faceUp ? 'up' : 'down')),
  tokens,
})

const pyramid = (counts: number[], tokensByRow: Record<number, LayoutRow['tokens']> = {}): LayoutRow[] =>
  counts.map((count, index) => row(count, index % 2 === 0, tokensByRow[index]))

const marks = (kind: TokenKind, indexes: number[]): LayoutRow['tokens'] =>
  Object.fromEntries(indexes.map((index) => [index, kind]))

export const layoutFor = (mode: GameMode, age: 1 | 2 | 3): AgeLayout => {
  const pantheon = hasPantheon(mode)

  if (hasAgora(mode)) {
    if (age === 1) {
      return {
        age,
        rows: pyramid([3, 4, 5, 6, 7], pantheon ? { 1: marks('mythology', [1, 3]), 3: marks('mythology', [0, 2, 5]) } : {}),
      }
    }
    if (age === 2) {
      return { age, rows: pyramid([7, 6, 5, 4, 3], pantheon ? { 1: marks('offering', [0, 2, 5]) } : {}) }
    }
    return { age, rows: pyramid([2, 3, 4, 5, 4, 3, 2]) }
  }

  if (age === 1) {
    return {
      age,
      rows: pyramid([2, 3, 4, 5, 6], pantheon ? { 1: marks('mythology', [0, 2]), 3: marks('mythology', [0, 2, 4]) } : {}),
    }
  }
  if (age === 2) {
    return { age, rows: pyramid([6, 5, 4, 3, 2], pantheon ? { 1: marks('offering', [0, 2, 4]) } : {}) }
  }
  const rows = pyramid([2, 3, 4, 3, 4, 3, 2])
  rows[3] = { slots: ['down', 'gap', 'down'] }
  return { age, rows }
}

export const cardsInLayout = (layout: AgeLayout): number =>
  layout.rows.reduce((sum, r) => sum + r.slots.filter((slot) => slot !== 'gap').length, 0)
