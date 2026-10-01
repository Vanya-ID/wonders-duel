import { useEffect, useRef } from 'react'
import { NavLink, Outlet } from 'react-router'
import { settingsStore } from '../services/settings'
import { useStore } from '../services/store'
import { syncStore } from '../services/sync'
import './Layout.css'

const TABS = [
  { to: '/score', icon: '🧮', label: 'Подсчёт' },
  { to: '/history', icon: '📜', label: 'История' },
  { to: '/setup', icon: '🎲', label: 'Подготовка' },
  { to: '/reference', icon: '📖', label: 'Справка' },
  { to: '/settings', icon: '⚙️', label: 'Настройки' },
]

const SYNC_LABELS = {
  local: 'Только на этом устройстве',
  idle: 'Синхронизировано',
  syncing: 'Синхронизация…',
  error: 'Ошибка синхронизации',
}

export const Layout = () => {
  const sync = useStore(syncStore)
  const { palette, theme } = useStore(settingsStore)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const syncThemeColor = () => {
      const meta = document.querySelector('meta[name="theme-color"]')
      if (headerRef.current && meta) {
        meta.setAttribute('content', getComputedStyle(headerRef.current).backgroundColor)
      }
    }
    syncThemeColor()
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', syncThemeColor)
    return () => media.removeEventListener('change', syncThemeColor)
  }, [palette, theme])

  return (
    <div className="app">
      <header className="app-header" ref={headerRef}>
        <div className="app-header-inner">
          <span className="app-title">7 Чудес: Дуэль</span>
          <span className={`sync-dot sync-${sync.status}`} title={sync.error ?? SYNC_LABELS[sync.status]} />
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="tab-bar">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className="tab">
            <span className="tab-icon" aria-hidden="true">
              {tab.icon}
            </span>
            <span className="tab-label">{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
