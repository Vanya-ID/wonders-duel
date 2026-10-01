import { type FormEvent, useState } from 'react'
import { BACKGROUNDS, PALETTES } from '../data/appearance'
import type { PlayerSlot } from '../domain/types'
import { PLAYER_SLOTS } from '../domain/types'
import { authStore, signInWithPassword, signOut, signUpWithPassword } from '../services/auth'
import { settingsStore, type ThemeSetting, updateSettings } from '../services/settings'
import { useStore } from '../services/store'
import { isSupabaseConfigured } from '../services/supabase'
import { renamePlayers, syncNow, syncStore } from '../services/sync'
import './SettingsPage.css'

const THEMES: { id: ThemeSetting; label: string }[] = [
  { id: 'system', label: 'Как в системе' },
  { id: 'light', label: 'Светлая' },
  { id: 'dark', label: 'Тёмная' },
]

const formatSyncTime = (timestamp: number | null): string =>
  timestamp ? new Date(timestamp).toLocaleString('ru-RU') : 'ещё не выполнялась'

const PlayersSection = () => {
  const settings = useStore(settingsStore)
  const [names, setNames] = useState<Record<PlayerSlot, string>>(settings.players)
  const changed = PLAYER_SLOTS.some((slot) => names[slot].trim() !== settings.players[slot])
  const valid = PLAYER_SLOTS.every((slot) => names[slot].trim().length > 0)

  return (
    <div className="panel">
      <h2>Игроки</h2>
      {PLAYER_SLOTS.map((slot, index) => (
        <label key={slot} className="field">
          <span>Игрок {index + 1}</span>
          <input
            className="text-input"
            value={names[slot]}
            maxLength={30}
            onChange={(event) => setNames({ ...names, [slot]: event.target.value })}
          />
        </label>
      ))}
      <button
        type="button"
        className="btn btn-block"
        disabled={!changed || !valid}
        onClick={() => renamePlayers({ p1: names.p1.trim(), p2: names.p2.trim() })}
      >
        Сохранить имена
      </button>
      <p className="muted">Имена общие для обоих телефонов, если вы вошли в общий аккаунт.</p>

      <div className="field">
        <span>Обычно на этом телефоне играет</span>
        <div className="segmented" role="group" aria-label="Игрок этого телефона">
          {PLAYER_SLOTS.map((slot) => (
            <button key={slot} type="button" aria-pressed={settings.deviceSlot === slot} onClick={() => updateSettings({ deviceSlot: slot })}>
              {settings.players[slot]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const AppearanceSection = () => {
  const settings = useStore(settingsStore)

  return (
    <div className="panel">
      <h2>Оформление</h2>
      <p className="muted">Только для этого телефона.</p>
      <div className="field">
        <span>Цвета</span>
        <div className="palette-grid" role="group" aria-label="Цветовая схема">
          {PALETTES.map((palette) => (
            <button
              key={palette.id}
              type="button"
              className="palette-option"
              data-palette={palette.id}
              aria-pressed={settings.palette === palette.id}
              onClick={() => updateSettings({ palette: palette.id })}
            >
              <span className="palette-preview" aria-hidden="true">
                <span className="palette-header" />
                <span className="palette-body">
                  <span className="palette-accent" />
                  <span className="palette-surface" />
                </span>
              </span>
              <span className="palette-name">{palette.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span>Тема</span>
        <div className="segmented" role="group" aria-label="Тема">
          {THEMES.map((theme) => (
            <button key={theme.id} type="button" aria-pressed={settings.theme === theme.id} onClick={() => updateSettings({ theme: theme.id })}>
              {theme.label}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span>Фон</span>
        <div className="segmented" role="group" aria-label="Фон">
          {BACKGROUNDS.map((background) => (
            <button
              key={background.id}
              type="button"
              aria-pressed={settings.background === background.id}
              onClick={() => updateSettings({ background: background.id })}
            >
              {background.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const AccountSection = () => {
  const auth = useStore(authStore)
  const sync = useStore(syncStore)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (!isSupabaseConfigured) {
    return (
      <div className="panel">
        <h2>Аккаунт</h2>
        <p className="muted">
          Синхронизация не настроена: в сборке не заданы ключи Supabase. История хранится только на этом телефоне.
        </p>
      </div>
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setPending(true)
    try {
      if (mode === 'sign-up') {
        const signedIn = await signUpWithPassword(email, password)
        setMessage(signedIn ? 'Аккаунт создан, вход выполнен' : 'Аккаунт создан — подтвердите email по ссылке из письма')
      } else {
        await signInWithPassword(email, password)
      }
      setPassword('')
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Не удалось выполнить вход')
    } finally {
      setPending(false)
    }
  }

  const handleSignOut = async () => {
    setError(null)
    try {
      await signOut()
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'Ошибка выхода')
    }
  }

  if (auth.user) {
    return (
      <div className="panel">
        <h2>Аккаунт</h2>
        <p>
          Вход выполнен: <strong>{auth.user.email}</strong>
        </p>
        <p className="muted">Последняя синхронизация: {formatSyncTime(sync.lastSyncAt)}</p>
        {sync.error && <p className="error-text">{sync.error}</p>}
        {error && <p className="error-text">{error}</p>}
        <div className="btn-row">
          <button type="button" className="btn" disabled={sync.status === 'syncing'} onClick={() => void syncNow()}>
            {sync.status === 'syncing' ? 'Синхронизация…' : 'Синхронизировать'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => void handleSignOut()}>
            Выйти
          </button>
        </div>
      </div>
    )
  }

  return (
    <form className="panel" onSubmit={(event) => void handleSubmit(event)}>
      <h2>Аккаунт</h2>
      <p className="muted">
        Войдите одним общим аккаунтом на обоих телефонах: история станет общей и заработает подсчёт очков на двух
        телефонах. Без входа история хранится только на этом телефоне.
      </p>
      <label className="field">
        <span>Email</span>
        <input className="text-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
      </label>
      <label className="field">
        <span>Пароль</span>
        <input
          className="text-input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
          minLength={6}
          required
        />
      </label>
      {error && <p className="error-text">{error}</p>}
      {message && <p className="success-text">{message}</p>}
      <div className="btn-row">
        <button type="submit" className="btn" disabled={pending || !auth.ready}>
          {mode === 'sign-up' ? 'Создать аккаунт' : 'Войти'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up')
            setError(null)
            setMessage(null)
          }}
        >
          {mode === 'sign-up' ? 'У нас уже есть аккаунт' : 'Создать аккаунт'}
        </button>
      </div>
    </form>
  )
}

export const SettingsPage = () => {
  const { players } = useStore(settingsStore)

  return (
    <div>
      <PlayersSection key={`${players.p1}|${players.p2}`} />
      <AppearanceSection />
      <AccountSection />
    </div>
  )
}
