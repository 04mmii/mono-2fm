import { useEffect, useRef } from 'react'
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
  const pageRef = useRef(null)

  const enterRoom = (mood) => {
    navigate('/room', { state: { mood } })
  }

  useEffect(() => {
    const node = pageRef.current
    if (!node) return

    let rafId = 0
    const target = { x: 50, y: 50 }
    const current = { x: 50, y: 50 }

    const onMove = (event) => {
      const w = window.innerWidth || 1
      const h = window.innerHeight || 1
      target.x = (event.clientX / w) * 100
      target.y = (event.clientY / h) * 100
    }

    const onLeave = () => {
      target.x = 50
      target.y = 50
    }

    const tick = () => {
      current.x += (target.x - current.x) * 0.17
      current.y += (target.y - current.y) * 0.17

      const nx = (current.x - 50) / 50
      const ny = (current.y - 50) / 50
      const drift = Math.sin(performance.now() * 0.00055)
      const hue = nx * 24 + drift * 8
      const saturation = 24 + Math.abs(nx) * 24 + Math.abs(ny) * 14 + Math.abs(drift) * 14
      const lift = ny * 10 + drift * 3

      node.style.setProperty('--mx', `${current.x}%`)
      node.style.setProperty('--my', `${current.y}%`)
      node.style.setProperty('--entry-hue', hue.toFixed(2))
      node.style.setProperty('--entry-sat', saturation.toFixed(2))
      node.style.setProperty('--entry-lift', lift.toFixed(2))
      rafId = window.requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    rafId = window.requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      window.cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div className="entry-page paper-texture" ref={pageRef}>
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
