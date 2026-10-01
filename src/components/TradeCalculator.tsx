import { useState } from 'react'
import { RESOURCES, type Resource, type TradeLine, lineCost, unitPrice } from '../domain/trade'
import { NumberStepper } from './NumberStepper'
import './TradeCalculator.css'

const emptyLine = (): TradeLine => ({ needed: 0, opponentProduction: 0, fixedPrice: false, decreeDiscount: false })

const initialLines = (): Record<Resource, TradeLine> => ({
  wood: emptyLine(),
  clay: emptyLine(),
  stone: emptyLine(),
  glass: emptyLine(),
  papyrus: emptyLine(),
})

export const TradeCalculator = ({ withAgora }: { withAgora: boolean }) => {
  const [lines, setLines] = useState(initialLines)
  const [brownDecree, setBrownDecree] = useState(false)
  const [greyDecree, setGreyDecree] = useState(false)

  const effective = (resource: Resource, brown: boolean): TradeLine => ({
    ...lines[resource],
    decreeDiscount: withAgora && (brown ? brownDecree : greyDecree),
  })

  const total = RESOURCES.reduce((sum, r) => sum + lineCost(effective(r.id, r.brown)), 0)

  const update = (resource: Resource, patch: Partial<TradeLine>) =>
    setLines((prev) => ({ ...prev, [resource]: { ...prev[resource], ...patch } }))

  return (
    <div className="trade">
      <p className="muted">
        «У соперника» — сколько символов этого ресурса на его коричневых и серых картах. Жёлтые карты и Чудеса соперника
        на цену не влияют.
      </p>
      {RESOURCES.map((resource) => {
        const line = effective(resource.id, resource.brown)
        return (
          <div key={resource.id} className={`trade-row ${resource.brown ? 'brown' : 'grey'}`}>
            <div className="trade-head">
              <strong>{resource.label}</strong>
              <span className="muted">
                {unitPrice(line)} мон./шт.
                {line.needed > 0 && <> · итого {lineCost(line)}</>}
              </span>
            </div>
            <div className="trade-inputs">
              <label>
                <span className="muted">нужно</span>
                <NumberStepper compact value={line.needed} max={9} label={`${resource.label}: нужно`} onChange={(needed) => update(resource.id, { needed })} />
              </label>
              <label>
                <span className="muted">у соперника</span>
                <NumberStepper
                  compact
                  value={line.opponentProduction}
                  max={9}
                  label={`${resource.label}: производство соперника`}
                  onChange={(opponentProduction) => update(resource.id, { opponentProduction })}
                />
              </label>
            </div>
            <label className="trade-check">
              <input type="checkbox" checked={line.fixedPrice} onChange={(event) => update(resource.id, { fixedPrice: event.target.checked })} />
              <span>есть карта «цена 1» (Склад / Таможня)</span>
            </label>
          </div>
        )
      })}
      {withAgora && (
        <div className="trade-decrees">
          <label className="trade-check">
            <input type="checkbox" checked={brownDecree} onChange={(event) => setBrownDecree(event.target.checked)} />
            <span>Декрет «−1 за коричневые ресурсы» под моим контролем</span>
          </label>
          <label className="trade-check">
            <input type="checkbox" checked={greyDecree} onChange={(event) => setGreyDecree(event.target.checked)} />
            <span>Декрет «−1 за серые ресурсы» под моим контролем</span>
          </label>
        </div>
      )}
      <div className="trade-total">
        Всего: <strong>{total}</strong> мон.
      </div>
      <button type="button" className="btn btn-secondary btn-block" onClick={() => setLines(initialLines())}>
        Сбросить
      </button>
    </div>
  )
}
