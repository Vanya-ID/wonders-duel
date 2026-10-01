import './NumberStepper.css'

interface NumberStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label: string
  compact?: boolean
}

export const NumberStepper = ({ value, onChange, min = 0, max = 199, label, compact = false }: NumberStepperProps) => {
  const clamp = (next: number) => Math.min(max, Math.max(min, next))

  return (
    <div className={compact ? 'stepper stepper-compact' : 'stepper'}>
      <button type="button" className="stepper-btn" onClick={() => onChange(clamp(value - 1))} aria-label={`${label}: минус 1`}>
        −
      </button>
      <input
        className="stepper-input"
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        aria-label={label}
        onFocus={(event) => event.target.select()}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10)
          onChange(Number.isNaN(parsed) ? min : clamp(parsed))
        }}
      />
      <button type="button" className="stepper-btn" onClick={() => onChange(clamp(value + 1))} aria-label={`${label}: плюс 1`}>
        +
      </button>
    </div>
  )
}
