import { useState } from 'react'
import { AgeLayoutView } from '../components/AgeLayoutView'
import { ModePicker } from '../components/ModePicker'
import { TradeCalculator } from '../components/TradeCalculator'
import { hasAgora } from '../data/modes'
import { REFERENCE_SECTIONS, type RefItem, formatCost, isExpansionInMode, isSectionInMode } from '../data/reference'
import { RULE_CARDS } from '../data/rules'
import { layoutFor } from '../data/setup'
import type { GameMode } from '../domain/types'
import { settingsStore } from '../services/settings'
import './ReferencePage.css'

type Tab = 'cards' | 'rules' | 'layouts' | 'trade'

const TABS: { id: Tab; label: string }[] = [
  { id: 'cards', label: 'Карты' },
  { id: 'rules', label: 'Правила' },
  { id: 'layouts', label: 'Раскладки' },
  { id: 'trade', label: 'Торговля' },
]

const matches = (item: RefItem, query: string): boolean =>
  [item.name, item.nameEn, item.effect, item.tag, item.note].some((field) => field?.toLowerCase().includes(query))

const ItemCard = ({ item }: { item: RefItem }) => (
  <li className="ref-item">
    <div className="ref-item-head">
      <strong>{item.name}</strong>
      {item.tag && <span className="badge">{item.tag}</span>}
      {item.points !== undefined && item.points > 0 && <span className="badge ref-points">{item.points} ПО</span>}
    </div>
    {item.cost && <div className="muted ref-cost">Стоимость: {formatCost(item.cost)}</div>}
    <p className="ref-effect">{item.effect}</p>
    {item.note && <p className="muted ref-note">{item.note}</p>}
    {item.nameEn && item.nameEn !== item.name && <div className="muted ref-en">{item.nameEn}</div>}
  </li>
)

const CardsTab = ({ mode }: { mode: GameMode }) => {
  const [query, setQuery] = useState('')
  const normalized = query.trim().toLowerCase()
  const sections = REFERENCE_SECTIONS.filter((section) => isSectionInMode(section, mode))
    .map((section) => ({ ...section, items: normalized ? section.items.filter((item) => matches(item, normalized)) : section.items }))
    .filter((section) => section.items.length > 0)

  return (
    <>
      <input
        className="text-input ref-search"
        type="search"
        placeholder="Поиск: название или эффект"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {sections.length === 0 && <p className="muted">Ничего не найдено.</p>}
      {sections.map((section) => (
        <details key={section.id} className="panel ref-section" open={normalized.length > 0}>
          <summary>
            <span>{section.title}</span>
            <span className="badge">{section.items.length}</span>
          </summary>
          {section.intro && <p className="muted ref-intro">{section.intro}</p>}
          <ul className="ref-items">
            {section.items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </ul>
        </details>
      ))}
    </>
  )
}

const RulesTab = ({ mode }: { mode: GameMode }) => (
  <>
    {RULE_CARDS.filter((card) => isExpansionInMode(card.expansion, mode)).map((card) => (
      <section key={card.id} className="panel">
        <h3>{card.title}</h3>
        <ul className="rule-points">
          {card.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>
    ))}
  </>
)

const LayoutsTab = ({ mode }: { mode: GameMode }) => (
  <div className="panel">
    {([1, 2, 3] as const).map((age) => (
      <AgeLayoutView key={age} layout={layoutFor(mode, age)} />
    ))}
  </div>
)

export const ReferencePage = () => {
  const [mode, setMode] = useState<GameMode>(settingsStore.get().lastMode)
  const [tab, setTab] = useState<Tab>('cards')

  return (
    <div className="reference-page">
      <div className="field">
        <ModePicker value={mode} onChange={setMode} />
      </div>
      <div className="segmented ref-tabs" role="tablist">
        {TABS.map((item) => (
          <button key={item.id} type="button" aria-pressed={tab === item.id} onClick={() => setTab(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      {tab === 'cards' && <CardsTab mode={mode} />}
      {tab === 'rules' && <RulesTab mode={mode} />}
      {tab === 'layouts' && <LayoutsTab mode={mode} />}
      {tab === 'trade' && (
        <div className="panel">
          <h2>Калькулятор торговли</h2>
          <TradeCalculator key={mode} withAgora={hasAgora(mode)} />
        </div>
      )}
    </div>
  )
}
