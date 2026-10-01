import { useState } from 'react'
import { ModePicker } from '../../components/ModePicker'
import { VICTORY_LABELS, instantVictoriesForMode } from '../../data/victories'
import type { GameMode, PlayerSlot, VictoryType } from '../../domain/types'
import { PLAYER_SLOTS } from '../../domain/types'
import { settingsStore, updateSettings } from '../../services/settings'
import { newId, useStore } from '../../services/store'
import { addGame } from '../../services/sync'

export const InstantVictoryForm = () => {
  const settings = useStore(settingsStore)
  const [mode, setMode] = useState<GameMode>(settings.lastMode)
  const [winner, setWinner] = useState<PlayerSlot | null>(null)
  const [victory, setVictory] = useState<VictoryType | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const available = instantVictoriesForMode(mode)
  const chosenVictory = victory && available.includes(victory) ? victory : null

  const save = () => {
    if (!winner || !chosenVictory) {
      return
    }
    addGame({
      id: newId(),
      playedAt: new Date().toISOString(),
      mode,
      players: settings.players,
      victory: chosenVictory,
      winner,
      scores: null,
      totals: null,
    })
    updateSettings({ lastMode: mode })
    setSaved(`${settings.players[winner]}: ${VICTORY_LABELS[chosenVictory].toLowerCase()} — записано в историю`)
    setWinner(null)
    setVictory(null)
  }

  return (
    <div className="panel">
      <h2>Мгновенная победа</h2>
      <p className="muted">Партия закончилась досрочно — очки не считаются. Записать можно с одного телефона, даже без интернета.</p>
      <div className="field">
        <span>Режим</span>
        <ModePicker value={mode} onChange={setMode} />
      </div>
      <div className="field">
        <span>Кто победил</span>
        <div className="segmented" role="group" aria-label="Победитель">
          {PLAYER_SLOTS.map((slot) => (
            <button key={slot} type="button" aria-pressed={winner === slot} onClick={() => setWinner(slot)}>
              {settings.players[slot]}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span>Как</span>
        <div className="segmented wrap" role="group" aria-label="Тип победы">
          {available.map((type) => (
            <button key={type} type="button" aria-pressed={chosenVictory === type} onClick={() => setVictory(type)}>
              {VICTORY_LABELS[type]}
            </button>
          ))}
        </div>
      </div>
      <button type="button" className="btn btn-block" disabled={!winner || !chosenVictory} onClick={save}>
        Записать победу
      </button>
      {saved && <p className="success-text">{saved}</p>}
    </div>
  )
}
