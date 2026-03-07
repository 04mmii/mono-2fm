import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import MiniPlayer from './components/MiniPlayer'
import EntryPage from './pages/EntryPage'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import { PlayerProvider } from './player/PlayerProvider'

function LoadingPage() {
  return (
    <main className="page-fallback">
      <h1>Loading...</h1>
    </main>
  )
}

function AppShell() {
  const location = useLocation()
  const hideMiniPlayer =
    location.pathname === '/' || location.pathname === '/entry' || location.pathname === '/loading'

  return (
    <>
      <Routes>
        <Route path="/" element={<EntryPage />} />
        <Route path="/room" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/entry" element={<EntryPage />} />
        <Route path="/loading" element={<LoadingPage />} />
        <Route path="*" element={<Navigate to="/entry" replace />} />
      </Routes>
      {!hideMiniPlayer ? <MiniPlayer /> : null}
    </>
  )
}

export default function App() {
  return (
    <PlayerProvider>
      <AppShell />
    </PlayerProvider>
  )
}
