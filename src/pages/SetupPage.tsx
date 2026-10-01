import { useState } from 'react'
import { AgeLayoutView } from '../components/AgeLayoutView'
import { ModePicker } from '../components/ModePicker'
import { DRAFT_STEPS, type DraftPicker, SETUP_PHASES, type SetupPhase, layoutFor, stepsForMode } from '../data/setup'
import type { GameMode, PlayerSlot } from '../domain/types'
import { PLAYER_SLOTS, otherSlot } from '../domain/types'
import { settingsStore } from '../services/settings'
import { createStore, useStore } from '../services/store'
import './SetupPage.css'

interface SetupState {
  mode: GameMode
  firstPlayer: PlayerSlot | null
  checked: string[]
  draftStep: number
}

const setupStore = createStore<SetupState>(
  { mode: settingsStore.get().lastMode, firstPlayer: null, checked: [], draftStep: 0 },
  'wonders-duel-setup',
)

const patchSetup = (patch: Partial<SetupState>) => setupStore.update((prev) => ({ ...prev, ...patch }))

const toggleChecked = (id: string) =>
  setupStore.update((prev) => ({
    ...prev,
    checked: prev.checked.includes(id) ? prev.checked.filter((c) => c !== id) : [...prev.checked, id],
  }))

const CoinToss = ({ players, firstPlayer }: { players: Record<PlayerSlot, string>; firstPlayer: PlayerSlot | null }) => {
  const [flipping, setFlipping] = useState(false)

  const toss = () => {
    setFlipping(true)
    patchSetup({ firstPlayer: null, draftStep: 0 })
    setTimeout(() => {
      patchSetup({ firstPlayer: Math.random() < 0.5 ? 'p1' : 'p2' })
      setFlipping(false)
    }, 900)
  }

  return (
    <div className="coin-toss">
      <h3>Первый игрок</h3>
      <div className={`coin ${flipping ? 'flipping' : ''}`} aria-live="polite">
        {flipping ? '…' : firstPlayer ? players[firstPlayer] : '?'}
      </div>
      <button type="button" className="btn btn-block" disabled={flipping} onClick={toss}>
        Бросить жребий
      </button>
      <div className="segmented coin-manual" role="group" aria-label="Первый игрок вручную">
        {PLAYER_SLOTS.map((slot) => (
          <button key={slot} type="button" aria-pressed={firstPlayer === slot} onClick={() => patchSetup({ firstPlayer: slot, draftStep: 0 })}>
            {players[slot]}
          </button>
        ))}
      </div>
    </div>
  )
}

const WonderDraft = ({ players, firstPlayer, draftStep }: { players: Record<PlayerSlot, string>; firstPlayer: PlayerSlot | null; draftStep: number }) => {
  if (!firstPlayer) {
    return <p className="muted">Выберите первого игрока — и подсказка поведёт по выбору Чудес.</p>
  }

  const slotOf = (picker: DraftPicker): PlayerSlot => (picker === 'first' ? firstPlayer : otherSlot(firstPlayer))
  const done = draftStep >= DRAFT_STEPS.length

  return (
    <div className="draft">
      <h3>Выбор Чудес</h3>
      <ol className="draft-steps">
        {DRAFT_STEPS.map((step, index) => (
          <li key={index} className={index === draftStep ? 'current' : index < draftStep ? 'done' : ''}>
            {(index === 0 || step.round !== DRAFT_STEPS[index - 1].round) && (
              <div className="draft-round">{step.round === 1 ? 'Раунд 1: откройте 4 Чуда' : 'Раунд 2: откройте ещё 4 Чуда'}</div>
            )}
            <span>
              <strong>{players[slotOf(step.picker)]}</strong> берёт{' '}
              {step.count === 2 ? '2 Чуда' : step.last ? 'оставшееся Чудо' : '1 Чудо'}
            </span>
          </li>
        ))}
      </ol>
      {done && <p className="success-text">Готово: у каждого по 4 Чуда. Остальные — в коробку.</p>}
      <div className="btn-row">
        <button type="button" className="btn btn-secondary" disabled={draftStep === 0} onClick={() => patchSetup({ draftStep: draftStep - 1 })}>
          Назад
        </button>
        <button type="button" className="btn" disabled={done} onClick={() => patchSetup({ draftStep: draftStep + 1 })}>
          Дальше
        </button>
      </div>
    </div>
  )
}

const PhasePanel = ({ phase, state, players }: { phase: SetupPhase; state: SetupState; players: Record<PlayerSlot, string> }) => {
  const steps = stepsForMode(phase, state.mode)

  return (
    <section className="panel">
      <h2>{phase.title}</h2>
      {steps.length > 0 && (
        <ul className="check-list">
          {steps.map((step) => {
            const id = `${phase.id}.${step.id}`
            return (
              <li key={id}>
                <label>
                  <input type="checkbox" checked={state.checked.includes(id)} onChange={() => toggleChecked(id)} />
                  <span>{step.text}</span>
                </label>
              </li>
            )
          })}
        </ul>
      )}
      {phase.kind === 'draft' && (
        <>
          <CoinToss players={players} firstPlayer={state.firstPlayer} />
          <WonderDraft players={players} firstPlayer={state.firstPlayer} draftStep={state.draftStep} />
        </>
      )}
      {phase.kind === 'age' && phase.age && <AgeLayoutView layout={layoutFor(state.mode, phase.age)} />}
    </section>
  )
}

export const SetupPage = () => {
  const state = useStore(setupStore)
  const { players } = useStore(settingsStore)

  return (
    <div className="setup-page">
      <div className="panel">
        <h2>Подготовка к партии</h2>
        <div className="field">
          <span>Режим</span>
          <ModePicker value={state.mode} onChange={(mode) => patchSetup({ mode })} />
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => patchSetup({ checked: [], firstPlayer: null, draftStep: 0 })}
        >
          Начать подготовку заново
        </button>
      </div>
      {SETUP_PHASES.map((phase) => (
        <PhasePanel key={phase.id} phase={phase} state={state} players={players} />
      ))}
    </div>
  )
}
