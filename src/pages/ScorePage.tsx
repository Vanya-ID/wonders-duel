import { useState } from 'react'
import { Link } from 'react-router'
import { ModePicker } from '../components/ModePicker'
import { modeLabel } from '../data/modes'
import type { GameMode, PlayerSlot } from '../domain/types'
import { PLAYER_SLOTS, otherSlot } from '../domain/types'
import { sheetOf } from '../services/scoreSession'
import { InstantVictoryForm } from './score/InstantVictoryForm'
import { RevealView } from './score/RevealView'
import { SheetForm } from './score/SheetForm'
import { useScoreSession } from './score/useScoreSession'
import './ScorePage.css'

type Tab = 'session' | 'instant'

const SessionLobby = ({ initialMode, busy, onStart }: { initialMode: GameMode; busy: boolean; onStart: (mode: GameMode) => void }) => {
  const [mode, setMode] = useState<GameMode>(initialMode)

  return (
    <div className="panel">
      <h2>Подсчёт очков</h2>
      <p className="muted">
        Каждый вводит свои очки на своём телефоне. Итог откроется сразу на обоих, когда оба нажмут «Готово». Второй
        телефон увидит подсчёт автоматически — достаточно открыть эту вкладку.
      </p>
      <div className="field">
        <span>Режим партии</span>
        <ModePicker value={mode} onChange={setMode} />
      </div>
      <button type="button" className="btn btn-block" disabled={busy} onClick={() => onStart(mode)}>
        Начать подсчёт
      </button>
    </div>
  )
}

const SessionView = () => {
  const state = useScoreSession()
  const { phase, session, players, mySlot, busy, error } = state

  if (phase === 'not-configured') {
    return (
      <div className="panel">
        <p>Подсчёт на двух телефонах недоступен: в сборке не заданы ключи Supabase.</p>
        <p className="muted">Мгновенную победу можно записать на соседней вкладке.</p>
      </div>
    )
  }

  if (phase === 'signed-out') {
    return (
      <div className="panel">
        <p>Чтобы считать очки на двух телефонах, войдите в общий аккаунт на обоих.</p>
        <Link className="btn btn-block" to="/settings">
          Открыть настройки
        </Link>
      </div>
    )
  }

  if (phase === 'offline') {
    return (
      <div className="panel">
        <p>
          <strong>Нужен интернет.</strong> Подсчёт идёт на двух телефонах сразу, без сети они не видят друг друга.
        </p>
      </div>
    )
  }

  if (phase === 'loading') {
    return <p className="muted">Загрузка…</p>
  }

  const errorBlock = error && <p className="error-text">{error}</p>
  const connectionNote = !state.connected && <p className="muted">Подключение к живому подсчёту…</p>

  if (!session) {
    return (
      <>
        <SessionLobby initialMode={state.lastMode} busy={busy} onStart={state.start} />
        {errorBlock}
      </>
    )
  }

  const first = session.sheet_p1
  const second = session.sheet_p2
  if (first?.submitted && second?.submitted) {
    return <RevealView session={session} players={players} onDismiss={state.dismiss} />
  }

  const cancelButton = (
    <button
      type="button"
      className="btn btn-danger btn-block cancel-session"
      disabled={busy}
      onClick={() => {
        if (window.confirm('Отменить подсчёт на обоих телефонах? Введённые очки пропадут.')) {
          void state.cancel()
        }
      }}
    >
      Отменить подсчёт
    </button>
  )

  if (!mySlot) {
    const preferred = state.preferredSlot
    const ordered: PlayerSlot[] = preferred ? [preferred, otherSlot(preferred)] : PLAYER_SLOTS
    return (
      <div className="panel">
        <h2>Чьи очки на этом телефоне?</h2>
        <p className="muted">{modeLabel(session.mode)}</p>
        <div className="slot-buttons">
          {ordered.map((slot) => {
            const taken = sheetOf(session, slot)
            return (
              <button key={slot} type="button" className="btn btn-block" disabled={busy || Boolean(taken)} onClick={() => void state.claim(slot)}>
                {players[slot]}
                {taken && <span className="slot-taken"> — уже на другом телефоне</span>}
              </button>
            )
          })}
        </div>
        {errorBlock}
        {connectionNote}
        {cancelButton}
      </div>
    )
  }

  const opponent = otherSlot(mySlot)
  const opponentSheet = sheetOf(session, opponent)
  const opponentStatus = !opponentSheet ? 'ещё не подключился к подсчёту' : opponentSheet.submitted ? 'готово ✓' : 'вводит очки…'
  const ownSheet = sheetOf(session, mySlot)

  return (
    <>
      <div className="panel">
        <div className="session-head">
          <h2>{players[mySlot]}</h2>
          <span className="badge">{modeLabel(session.mode)}</span>
        </div>
        <p className="opponent-status">
          {players[opponent]}: {opponentStatus}
        </p>
        {ownSheet?.submitted ? (
          <>
            <p>
              Ваши очки отправлены. Итог откроется, когда {players[opponent]} нажмёт «Готово».
            </p>
            <button type="button" className="btn btn-secondary btn-block" disabled={busy} onClick={() => void state.reopen()}>
              Изменить мои очки
            </button>
          </>
        ) : (
          <SheetForm mode={session.mode} values={state.draftValues} busy={busy} onChange={state.changeDraft} onSubmit={() => void state.submit()} />
        )}
        {errorBlock}
        {connectionNote}
      </div>
      {cancelButton}
    </>
  )
}

export const ScorePage = () => {
  const [tab, setTab] = useState<Tab>('session')

  return (
    <div className="score-page">
      <div className="segmented page-tabs" role="tablist">
        <button type="button" aria-pressed={tab === 'session'} onClick={() => setTab('session')}>
          Подсчёт очков
        </button>
        <button type="button" aria-pressed={tab === 'instant'} onClick={() => setTab('instant')}>
          Мгновенная победа
        </button>
      </div>
      {tab === 'session' ? <SessionView /> : <InstantVictoryForm />}
    </div>
  )
}
