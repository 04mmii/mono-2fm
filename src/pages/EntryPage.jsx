import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'

// hint / line 값은 api/recommend.js의 FALLBACKS에 있는 query / playlistMood와 같다.
// hue / sat / lift는 무드에 따라 배경 색온도를 미세하게 미는 오프셋이다.
const MOODS = [
  {
    id: 'quiet afternoon',
    hint: 'city pop 1980s',
    line: '햇살이 길게 눕는 오후의 시티팝',
    hue: 3,
    sat: 10,
    lift: 2,
  },
  {
    id: 'slow rain',
    hint: 'vintage jazz standards',
    line: '빗방울을 세는 빈티지 재즈',
    hue: -16,
    sat: -8,
    lift: -2,
  },
  {
    id: 'warm tape',
    hint: '70s soul',
    line: '테이프에 눌러 담은 70년대 소울',
    hue: -5,
    sat: 18,
    lift: 1,
  },
  {
    id: 'late night room',
    hint: '80s synth pop',
    line: '새벽 방 안을 채우는 80년대 신스팝',
    hue: -24,
    sat: 4,
    lift: -3,
  },
  {
    id: 'faded memory',
    hint: 'oldies love songs',
    line: '색이 바랜 올디스 러브송',
    hue: -2,
    sat: -6,
    lift: 0,
  },
]

const NEUTRAL = { hue: 0, sat: 0, lift: 0 }

export default function EntryPage() {
  const navigate = useNavigate()
  const pageRef = useRef(null)
  const moodTargetRef = useRef(NEUTRAL)

  const [activeIndex, setActiveIndex] = useState(-1)
  const [lastIndex, setLastIndex] = useState(0)
  const [armed, setArmed] = useState(false)

  const enterRoom = (mood) => {
    navigate('/room', { state: { mood } })
  }

  const focusMood = (index) => {
    const mood = MOODS[index]
    if (!mood) return
    setActiveIndex(index)
    setLastIndex(index)
    setArmed(true)
    moodTargetRef.current = { hue: mood.hue, sat: mood.sat, lift: mood.lift }
  }

  const blurMood = () => {
    setActiveIndex(-1)
    moodTargetRef.current = NEUTRAL
  }

  useEffect(() => {
    const node = pageRef.current
    if (!node) return

    let rafId = 0
    const target = { x: 50, y: 50 }
    const current = { x: 50, y: 50 }
    const mood = { hue: 0, sat: 0, lift: 0 }

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

      // 고른 무드 쪽으로 색온도를 천천히 민다.
      const moodTarget = moodTargetRef.current
      mood.hue += (moodTarget.hue - mood.hue) * 0.06
      mood.sat += (moodTarget.sat - mood.sat) * 0.06
      mood.lift += (moodTarget.lift - mood.lift) * 0.06

      const nx = (current.x - 50) / 50
      const ny = (current.y - 50) / 50
      const drift = Math.sin(performance.now() * 0.00055)
      const hue = nx * 24 + drift * 8 + mood.hue
      const saturation =
        24 +
        Math.abs(nx) * 24 +
        Math.abs(ny) * 14 +
        Math.abs(drift) * 14 +
        mood.sat
      const lift = ny * 10 + drift * 3 + mood.lift

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

  const active = activeIndex >= 0 ? MOODS[activeIndex] : null
  const needleIndex = activeIndex >= 0 ? activeIndex : lastIndex

  return (
    <div className="entry-page paper-texture" ref={pageRef}>
      <div className="entry-layout">
        <AppHeader variant="entry" />

        <main className="entry-main">
          <section className="entry-hero" aria-label="Mood selection hero">
            <div className="entry-content">
              <p className="entry-kicker">MONO.FM LISTENING ROOM</p>
              <h1>How do you feel right now?</h1>
              <p className="entry-subtitle">
                지금의 기분을 건네주세요. <br />
                AI 큐레이터가 어울리는 옛 음악을 찾아 턴테이블에 올려둘게요.
              </p>
            </div>

            <div className="entry-mood-panel">
              <p className="entry-mood-caption">Tell the AI your mood</p>

              <div className="entry-dial">
                <div className="entry-dial-grid" role="list" aria-label="Mood options">
                  {MOODS.map((mood, index) => (
                    <button
                      key={mood.id}
                      type="button"
                      className={`dial-mood${index === activeIndex ? ' is-active' : ''}`}
                      onClick={() => enterRoom(mood.id)}
                      onMouseEnter={() => focusMood(index)}
                      onMouseLeave={blurMood}
                      onFocus={() => focusMood(index)}
                      onBlur={blurMood}
                    >
                      <span className="dial-mood-name">{mood.id}</span>
                      <span className="dial-mood-hint">{mood.hint}</span>
                    </button>
                  ))}
                </div>

                <div className="entry-ruler" aria-hidden>
                  <div className="entry-ruler-line" />
                  <div className="entry-ruler-ticks">
                    {MOODS.map((mood) => (
                      <span key={mood.id} className="entry-ruler-tick-slot">
                        <span className="entry-ruler-tick" />
                      </span>
                    ))}
                  </div>
                  <div
                    className={`entry-needle${armed ? ' is-armed' : ''}${
                      activeIndex >= 0 ? ' is-visible' : ''
                    }`}
                    style={{ '--dial-index': needleIndex }}
                  >
                    <span />
                  </div>
                </div>

                <p className={`entry-mood-line${active ? ' is-visible' : ''}`}>
                  {active ? active.line : ' '}
                </p>
              </div>
            </div>
          </section>
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
