import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { HistoryPage } from './pages/HistoryPage'
import { ReferencePage } from './pages/ReferencePage'
import { ScorePage } from './pages/ScorePage'
import { SettingsPage } from './pages/SettingsPage'
import { SetupPage } from './pages/SetupPage'

export const App = () => (
  <HashRouter>
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/score" replace />} />
        <Route path="score" element={<ScorePage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="setup" element={<SetupPage />} />
        <Route path="reference" element={<ReferencePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/score" replace />} />
      </Route>
    </Routes>
  </HashRouter>
)
