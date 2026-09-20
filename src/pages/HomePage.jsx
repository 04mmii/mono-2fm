import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { searchTracks } from '../lib/musicApi'
import { usePlayer } from '../player/PlayerProvider'

const FALLBACK_QUERY = 'city pop 1980s'

function getTitle(track) {
  return track?.title || track?.name || track?.trackName || 'No track selected'
}

function getArtist(track) {
  return track?.artist || track?.artistName || '-'
}

function getGenre(track) {
  return track?.genre || track?.primaryGenreName || '-'
}

function getDuration(track) {
  if (track?.duration) return track.duration
  const ms = track?.trackTimeMillis
  if (!ms) return '--:--'
  const sec = Math.floor(ms / 1000)
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

export default function HomePage() {
  const location = useLocation()
  const { currentTrack, isPlaying, toggle, play, setTrack, setQueue, nextTrack } = usePlayer()
  const [inputValue, setInputValue] = useState('')
  const [curation, setCuration] = useState(null)
  const [isCurating, setIsCurating] = useState(true)

  // 무드는 /entry에서 넘어온 값으로 시작하지만, 헤더에서 다시 입력할 수 있어야 하므로
  // 라우터 state가 아니라 여기 state가 진짜 소스다.
  const routeMood = location.state?.mood
  const [mood, setMood] = useState(() => routeMood || 'ambient calm')

  useEffect(() => {
    if (routeMood) setMood(routeMood)
  }, [routeMood])

  // setQueue/setTrack은 호출할 때마다 identity가 바뀌므로,
  // 같은 무드에 대해서는 effect 본문이 다시 돌지 않도록 막는다.
  const loadedMoodRef = useRef(null)

  // 무드를 고르는 행위 자체가 재생 의사다. 큐가 준비되면 바로 튼다.
  const autoPlayRef = useRef(true)

  useEffect(() => {
    if (loadedMoodRef.current === mood) return
    loadedMoodRef.current = mood

    let active = true
    setIsCurating(true)

    const load = async () => {
      let query = FALLBACK_QUERY
      let note = null

      // 1. Claude가 무드를 읽고 레트로 검색어를 만들어준다.
      try {
        const res = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mood }),
        })
        if (!res.ok) throw new Error(`Recommend failed (${res.status})`)
        const data = await res.json()
        if (data?.query) query = data.query
        if (data?.reason || data?.playlistMood) {
          note = { reason: data.reason || '', playlistMood: data.playlistMood || '' }
        }
      } catch {
        // AI 호출이 실패해도 레트로 기본 검색어로 재생은 이어간다.
        query = FALLBACK_QUERY
      }

      if (!active) return
      setCuration(note)

      // 2. 검색은 기존대로 iTunes Search API를 그대로 쓴다.
      try {
        const tracks = await searchTracks(query, 12)
        if (!active) return
        setQueue(tracks)
        if (tracks.length > 0) {
          setTrack(tracks[0])
          autoPlayRef.current = true
        }
      } catch {
        if (!active) return
        setQueue([])
      } finally {
        if (active) setIsCurating(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [mood, setQueue, setTrack])

  // 큐와 현재 곡이 실제로 세팅된 뒤에 재생을 시작한다. load() 안에서 바로 play()를
  // 부르면 아직 반영되지 않은 빈 큐를 보고 큐를 덮어써 버린다.
  useEffect(() => {
    if (!autoPlayRef.current) return
    if (!currentTrack) return
    autoPlayRef.current = false
    play()
  }, [currentTrack, play])

  // 헤더 입력창은 검색이 아니라 "무드 다시 말하기"다.
  // 제출하면 mood state가 바뀌고, 무드가 바뀔 때 도는 추천 파이프라인이 그대로 다시 돈다.
  const onSubmitMood = (event) => {
    event.preventDefault()
    const nextMood = inputValue.trim()
    if (!nextMood) return
    autoPlayRef.current = true
    setMood(nextMood)
    setInputValue('')
  }

  return (
    <div className="mono-page">
      <div className="home-bg-media" aria-hidden>
        <video className="home-bg-video" autoPlay muted loop playsInline preload="auto">
          <source src="/bg-turntable-home.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="grain-overlay" />
      <AppHeader
        variant="main"
        active="room"
        showSearch
        searchValue={inputValue}
        searchPlaceholder="다른 기분을 말해보세요 (예: 나른한 오후, 비 오는 밤...)"
        searchAriaLabel="새로운 무드 입력"
        onSearchChange={(e) => setInputValue(e.target.value)}
        onSearchSubmit={onSubmitMood}
      />

      <main className="hero room-hero" data-purpose="hero-content">
        <section className="track-info" data-purpose="track-info">
          <p className="track-number">today&apos;s mood: {mood}</p>
          <h2 className="track-title">
            {isCurating ? 'Curating a retro mix…' : getTitle(currentTrack)}
          </h2>
          <p className={curation ? 'artist-name artist-name--with-note' : 'artist-name'}>
            by {getArtist(currentTrack)}
          </p>

          {curation && (
            <div className="ai-note">
              {curation.playlistMood && (
                <p className="ai-playlist-mood">{curation.playlistMood}</p>
              )}
              {curation.reason && <p className="ai-reason">{curation.reason}</p>}
            </div>
          )}

          <div className="meta-row">
            <div>
              <span className="meta-label">Genre</span>
              <span className="meta-value">{getGenre(currentTrack)}</span>
            </div>
            <div>
              <span className="meta-label">Duration</span>
              <span className="meta-value">{getDuration(currentTrack)}</span>
            </div>
          </div>

          <div className="room-actions">
            <button type="button" className="room-play-btn" onClick={toggle} aria-label={isPlaying ? 'Pause' : 'Play'}>
              <span className={isPlaying ? 'icon-pause' : 'icon-play'} aria-hidden />
            </button>
            <Link to="/entry" className="change-mood-link">
              change mood
            </Link>
          </div>

          <p className="queue-inline">
            Next in queue: {nextTrack ? `${getTitle(nextTrack)} — ${getArtist(nextTrack)}` : 'No queue'}
          </p>
        </section>
      </main>
    </div>
  )
}
