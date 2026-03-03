import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'

const MOODS = [
  'quiet afternoon',
  'slow rain',
  'warm tape',
  'late night room',
  'faded memory',
]

export default function EntryPage() {
  const navigate = useNavigate()

  const enterRoom = (mood) => {
    navigate('/room', { state: { mood } })
  }

  return (
    <div className="entry-page paper-texture">
      <div className="entry-layout">
        <AppHeader variant="entry" />

        <main className="entry-main">
          <div className="entry-content">
            <h1>choose your analog mood</h1>
            <p>warm analog aesthetic • premium sound</p>
            <div className="entry-moods">
              {MOODS.map((mood) => (
                <button key={mood} type="button" className="mood-button" onClick={() => enterRoom(mood)}>
                  {mood}
                </button>
              ))}
            </div>
          </div>
        </main>

        <footer className="entry-footer">
          <div className="entry-line" />
          <div className="entry-links">
            <a href="#">Instagram</a>
            <a href="#">Spotify</a>
            <a href="#">Contact</a>
          </div>
          <p>© 2024 MONO.FM — CRAFTED FOR THE SOUL</p>
        </footer>

        <button type="button" className="entry-volume" aria-label="Volume">
          🔊
        </button>
      </div>
      <div className="entry-felt-overlay" aria-hidden />
    </div>
  )
}
