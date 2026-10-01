import { NumberStepper } from '../../components/NumberStepper'
import { MILITARY_OPTIONS, SENATE_CHAMBER_POINTS, TEMPLE_POINTS } from '../../data/scoreCategories'
import {
  categoriesForMode,
  coinsToPoints,
  isChamberControlled,
  senateToPoints,
  toggleChamber,
  totalPoints,
} from '../../domain/scoring'
import type { CategoryDef, GameMode, ScoreValues } from '../../domain/types'

interface SheetFormProps {
  mode: GameMode
  values: ScoreValues
  busy: boolean
  onChange: (values: ScoreValues) => void
  onSubmit: () => void
}

const CategoryInput = ({ category, value, onChange }: { category: CategoryDef; value: number; onChange: (value: number) => void }) => {
  switch (category.input) {
    case 'military':
      return (
        <div className="segmented" role="group" aria-label={category.label}>
          {MILITARY_OPTIONS.map((option) => (
            <button key={option} type="button" aria-pressed={value === option} onClick={() => onChange(option)}>
              {option}
            </button>
          ))}
        </div>
      )
    case 'temples':
      return (
        <div className="segmented" role="group" aria-label={category.label}>
          {TEMPLE_POINTS.map((points, count) => (
            <button key={count} type="button" aria-pressed={value === count} onClick={() => onChange(count)}>
              {count}
              <span className="option-sub">{points} ПО</span>
            </button>
          ))}
        </div>
      )
    case 'senate':
      return (
        <div className="senate-input">
          <div className="senate-chambers" role="group" aria-label={category.label}>
            {SENATE_CHAMBER_POINTS.map((points, chamber) => (
              <button
                key={chamber}
                type="button"
                className="senate-chamber"
                aria-pressed={isChamberControlled(value, chamber)}
                aria-label={`Палата ${chamber + 1}, ${points} ПО`}
                onClick={() => onChange(toggleChamber(value, chamber))}
              >
                {points}
              </button>
            ))}
          </div>
          <span className="muted">= {senateToPoints(value)} ПО</span>
        </div>
      )
    case 'coins':
      return (
        <div className="sheet-input">
          <NumberStepper value={value} label={category.label} onChange={onChange} />
          <span className="muted">= {coinsToPoints(value)} ПО</span>
        </div>
      )
    case 'points':
      return (
        <div className="sheet-input">
          <NumberStepper value={value} label={category.label} onChange={onChange} />
        </div>
      )
  }
}

export const SheetForm = ({ mode, values, busy, onChange, onSubmit }: SheetFormProps) => (
  <div className="sheet">
    {categoriesForMode(mode).map((category) => (
      <div key={category.id} className="sheet-row">
        <div className="sheet-label">
          <span className="color-dot" style={{ background: category.color }} />
          <div>
            <div>{category.label}</div>
            {category.hint && <div className="muted">{category.hint}</div>}
          </div>
        </div>
        <CategoryInput
          category={category}
          value={values[category.id] ?? 0}
          onChange={(next) => onChange({ ...values, [category.id]: next })}
        />
      </div>
    ))}
    <div className="sheet-total">
      Мои очки: <strong>{totalPoints(mode, values)}</strong>
    </div>
    <button type="button" className="btn btn-block" onClick={onSubmit} disabled={busy}>
      Готово — отправить
    </button>
  </div>
)
