import { TIEBREAK_CATEGORY } from '../../data/scoreCategories'
import { buildCivilianGame, categoriesForMode, categoryPoints } from '../../domain/scoring'
import type { PlayerSlot } from '../../domain/types'
import { PLAYER_SLOTS } from '../../domain/types'
import type { ScoreSession } from '../../services/scoreSession'

interface RevealViewProps {
  session: ScoreSession
  players: Record<PlayerSlot, string>
  onDismiss: () => void
}

export const RevealView = ({ session, players, onDismiss }: RevealViewProps) => {
  const scores = { p1: session.sheet_p1?.values ?? {}, p2: session.sheet_p2?.values ?? {} }
  const game = buildCivilianGame({ id: session.id, playedAt: session.created_at, mode: session.mode, players, scores })
  const totals = game.totals ?? { p1: 0, p2: 0 }
  const tieBroken = game.winner !== 'draw' && totals.p1 === totals.p2
  const tiebreakLabel = categoriesForMode(session.mode).find((c) => c.id === TIEBREAK_CATEGORY)?.label

  return (
    <div className="reveal">
      <div className={`reveal-banner ${game.winner === 'draw' ? 'draw' : ''}`}>
        {game.winner === 'draw' ? 'Ничья!' : `Победа: ${players[game.winner]}`}
      </div>
      {tieBroken && <p className="muted reveal-note">Очков поровну — победа по разделу «{tiebreakLabel}».</p>}
      {game.winner === 'draw' && <p className="muted reveal-note">Очков поровну и в разделе «{tiebreakLabel}» тоже — победа общая.</p>}
      <table className="reveal-table">
        <thead>
          <tr>
            <th />
            {PLAYER_SLOTS.map((slot) => (
              <th key={slot} className={game.winner === slot ? 'winner' : ''}>
                {players[slot]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categoriesForMode(session.mode).map((category) => (
            <tr key={category.id}>
              <td>
                <span className="color-dot" style={{ background: category.color }} /> {category.label}
              </td>
              {PLAYER_SLOTS.map((slot) => {
                const raw = scores[slot][category.id] ?? 0
                return (
                  <td key={slot}>
                    {categoryPoints(category, raw)}
                    {category.input === 'coins' && <span className="muted"> ({raw} мон.)</span>}
                    {category.input === 'temples' && <span className="muted"> ({raw} хр.)</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Итого</td>
            {PLAYER_SLOTS.map((slot) => (
              <td key={slot} className={game.winner === slot ? 'winner' : ''}>
                {totals[slot]}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
      <p className="muted">Партия сохранена в историю.</p>
      <button type="button" className="btn btn-block" onClick={onDismiss}>
        Новый подсчёт
      </button>
    </div>
  )
}
