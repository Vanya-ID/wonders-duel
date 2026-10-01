import { type AgeLayout, cardsInLayout } from '../data/setup'
import './AgeLayoutView.css'

const AGE_NAMES = { 1: 'Эпоха I', 2: 'Эпоха II', 3: 'Эпоха III' }

export const AgeLayoutView = ({ layout }: { layout: AgeLayout }) => {
  const hasTokens = layout.rows.some((row) => row.tokens && Object.keys(row.tokens).length > 0)

  return (
    <figure className="age-layout">
      <figcaption>
        {AGE_NAMES[layout.age]} · {cardsInLayout(layout)} карт
      </figcaption>
      <div className="age-rows">
        {layout.rows.map((row, rowIndex) => (
          <div key={rowIndex} className="age-row">
            {row.slots.map((slot, slotIndex) => {
              const token = row.tokens?.[slotIndex]
              return (
                <span key={slotIndex} className={`age-card ${slot}`}>
                  {token && <span className={`age-token ${token}`}>{token === 'mythology' ? 'М' : 'Ж'}</span>}
                </span>
              )
            })}
          </div>
        ))}
      </div>
      <div className="age-legend muted">
        <span>
          <span className="age-card up legend" /> лицом вверх
        </span>
        <span>
          <span className="age-card down legend" /> рубашкой вверх
        </span>
        {hasTokens && (
          <span>
            <span className="age-token mythology legend">М</span> Мифология
          </span>
        )}
        {hasTokens && (
          <span>
            <span className="age-token offering legend">Ж</span> Жертвоприношение
          </span>
        )}
      </div>
      <p className="muted age-hint">Верхний ряд — дальний от игроков, нижний ряд доступен в начале Эпохи.</p>
    </figure>
  )
}
