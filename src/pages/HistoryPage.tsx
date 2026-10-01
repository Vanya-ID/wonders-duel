import { useState } from 'react'
import { MODES, modeLabel } from '../data/modes'
import { VICTORY_LABELS, VICTORY_SHORT } from '../data/victories'
import { categoriesForMode, categoryPoints } from '../domain/scoring'
import { computeStats, sortByPlayedAt } from '../domain/stats'
import type { PlayerSlot, StoredGame } from '../domain/types'
import { PLAYER_SLOTS } from '../domain/types'
import { settingsStore } from '../services/settings'
import { useStore } from '../services/store'
import { activeGames, deleteGame, gamesStore } from '../services/sync'
import './HistoryPage.css'

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const formatAvg = (value: number | null): string => (value === null ? '—' : value.toFixed(1).replace('.', ','))

const GameDetails = ({ game, players }: { game: StoredGame; players: Record<PlayerSlot, string> }) => {
  if (!game.scores) {
    return <p className="muted">{VICTORY_LABELS[game.victory]} — очки не считались.</p>
  }
  const scores = game.scores

  return (
    <table className="details-table">
      <tbody>
        {categoriesForMode(game.mode).map((category) => (
          <tr key={category.id}>
            <td>
              <span className="color-dot" style={{ background: category.color }} /> {category.label}
            </td>
            {PLAYER_SLOTS.map((slot) => (
              <td key={slot}>{categoryPoints(category, scores[slot][category.id] ?? 0)}</td>
            ))}
          </tr>
        ))}
        <tr className="details-total">
          <td>Итого</td>
          {PLAYER_SLOTS.map((slot) => (
            <td key={slot}>
              {players[slot]}: {game.totals?.[slot] ?? 0}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  )
}

export const HistoryPage = () => {
  const { games } = useStore(gamesStore)
  const { players } = useStore(settingsStore)
  const [openId, setOpenId] = useState<string | null>(null)
  const visible = activeGames(games)
  const stats = computeStats(visible)
  const recent = sortByPlayedAt(visible).reverse()

  if (visible.length === 0) {
    return (
      <div className="panel">
        <h2>История</h2>
        <p className="muted">Партий пока нет. Сыгранные партии появятся здесь после подсчёта очков или записи мгновенной победы.</p>
      </div>
    )
  }

  const leader = stats.wins.p1 === stats.wins.p2 ? null : stats.wins.p1 > stats.wins.p2 ? 'p1' : 'p2'

  return (
    <div className="history-page">
      <div className="panel scoreboard">
        <div className={`scoreboard-side ${leader === 'p1' ? 'leading' : ''}`}>
          <div className="scoreboard-name">{players.p1}</div>
          <div className="scoreboard-wins">{stats.wins.p1}</div>
        </div>
        <div className="scoreboard-sep">:</div>
        <div className={`scoreboard-side ${leader === 'p2' ? 'leading' : ''}`}>
          <div className="scoreboard-name">{players.p2}</div>
          <div className="scoreboard-wins">{stats.wins.p2}</div>
        </div>
        <div className="scoreboard-meta muted">
          Партий: {stats.total}
          {stats.draws > 0 && `, ничьих: ${stats.draws}`}
        </div>
      </div>

      <div className="panel">
        <h3>Серии</h3>
        <p>
          Сейчас:{' '}
          {stats.currentStreak ? (
            <strong>
              {players[stats.currentStreak.slot]} — {stats.currentStreak.length} подряд
            </strong>
          ) : (
            '—'
          )}
        </p>
        <p className="muted">
          Самая длинная: {players.p1} — {stats.longestStreak.p1}, {players.p2} — {stats.longestStreak.p2}
        </p>
      </div>

      <div className="panel">
        <h3>По режимам</h3>
        <table className="stats-table">
          <thead>
            <tr>
              <th />
              <th>{players.p1}</th>
              <th>{players.p2}</th>
              <th>Всего</th>
            </tr>
          </thead>
          <tbody>
            {stats.byMode.map((row) => (
              <tr key={row.mode}>
                <td>{MODES.find((m) => m.id === row.mode)?.short}</td>
                <td>{row.wins.p1}</td>
                <td>{row.wins.p2}</td>
                <td>{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {stats.byVictory.length > 0 && (
        <div className="panel">
          <h3>Как побеждали</h3>
          <table className="stats-table">
            <thead>
              <tr>
                <th />
                <th>{players.p1}</th>
                <th>{players.p2}</th>
              </tr>
            </thead>
            <tbody>
              {stats.byVictory.map((row) => (
                <tr key={row.victory}>
                  <td>{VICTORY_LABELS[row.victory]}</td>
                  <td>{row.wins.p1}</td>
                  <td>{row.wins.p2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="panel">
        <h3>Очки</h3>
        <p>
          Средний счёт: {players.p1} — {formatAvg(stats.avgScore.p1)}, {players.p2} — {formatAvg(stats.avgScore.p2)}
        </p>
        {stats.bestScore && (
          <p>
            Рекорд: <strong>{stats.bestScore.value}</strong> — {players[stats.bestScore.slot]},{' '}
            <span className="muted">{formatDate(stats.bestScore.game.playedAt)}</span>
          </p>
        )}
        {stats.biggestMargin && (
          <p>
            Самый крупный разгром: <strong>+{stats.biggestMargin.value}</strong> — {players[stats.biggestMargin.slot]},{' '}
            <span className="muted">{formatDate(stats.biggestMargin.game.playedAt)}</span>
          </p>
        )}
        {!stats.bestScore && <p className="muted">Пока не было партий, доигранных до подсчёта очков.</p>}
      </div>

      <h2 className="games-title">Партии</h2>
      <ul className="games-list">
        {recent.map((game) => {
          const open = openId === game.id
          return (
            <li key={game.id} className="panel game-item">
              <button type="button" className="game-summary" onClick={() => setOpenId(open ? null : game.id)} aria-expanded={open}>
                <span className="game-main">
                  <span className="game-winner">
                    {game.winner === 'draw' ? 'Ничья' : `🏆 ${players[game.winner]}`}
                    {game.totals && (
                      <span className="game-score">
                        {' '}
                        {game.totals.p1} : {game.totals.p2}
                      </span>
                    )}
                  </span>
                  <span className="muted">
                    {formatDate(game.playedAt)} · {modeLabel(game.mode)} · {VICTORY_SHORT[game.victory]}
                  </span>
                </span>
                <span className="game-chevron" aria-hidden="true">
                  {open ? '▴' : '▾'}
                </span>
              </button>
              {open && (
                <div className="game-details">
                  <GameDetails game={game} players={players} />
                  <button
                    type="button"
                    className="btn btn-danger btn-block"
                    onClick={() => {
                      if (window.confirm('Удалить партию из истории на обоих телефонах?')) {
                        deleteGame(game.id)
                        setOpenId(null)
                      }
                    }}
                  >
                    Удалить партию
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
