import { MODES } from '../data/modes'
import type { GameMode } from '../domain/types'

interface ModePickerProps {
  value: GameMode
  onChange: (mode: GameMode) => void
}

export const ModePicker = ({ value, onChange }: ModePickerProps) => (
  <div className="segmented wrap" role="group" aria-label="Режим игры">
    {MODES.map((mode) => (
      <button key={mode.id} type="button" aria-pressed={mode.id === value} onClick={() => onChange(mode.id)}>
        {mode.label}
      </button>
    ))}
  </div>
)
