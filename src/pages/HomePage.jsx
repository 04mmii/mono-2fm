import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const { currentTrack, isPlaying, toggle, setTrack, setQueue, nextTrack } = usePlayer()
  const [inputValue, setInputValue] = useState('ambient')
  const [curation, setCuration] = useState(null)
  const [isCurating, setIsCurating] = useState(true)
  const mood = location.state?.mood || 'ambient calm'

  // setQueue/setTrack은 호출할 때마다 identity가 바뀌므로,
  // 같은 무드에 대해서는 effect 본문이 다시 돌지 않도록 막는다.
  const loadedMoodRef = useRef(null)

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

  const onSubmitSearch = (event) => {
    event.preventDefault()
    const query = inputValue.trim()
    if (!query) {
      navigate('/search')
      return
    }
    navigate(`/search?q=${encodeURIComponent(query)}`)
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
        searchPlaceholder="오늘, 어떤 온도의 음악을 들을까요?"
        onSearchChange={(e) => setInputValue(e.target.value)}
        onSearchSubmit={onSubmitSearch}
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
