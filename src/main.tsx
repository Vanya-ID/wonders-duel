import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/forum/400.css'
import './index.css'
import { App } from './App'
import { initAuth } from './services/auth'
import { applyTheme, settingsStore } from './services/settings'
import { startAutoSync } from './services/sync'

applyTheme(settingsStore.get().theme)
initAuth()
startAutoSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
