import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { searchTracks } from '../lib/musicApi'
import { usePlayer } from '../player/PlayerProvider'

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
  const { currentTrack, isPlaying, toggle, setTrack, setQueue, queue, nextTrack } = usePlayer()
  const [inputValue, setInputValue] = useState('ambient')
  const mood = location.state?.mood || 'ambient calm'

  useEffect(() => {
    if (queue.length > 0) return

    let active = true
    const load = async () => {
      try {
        const data = await searchTracks('ambient', 12)
        if (!active) return
        setQueue(data)
        if (!currentTrack && data.length > 0) {
          setTrack(data[0])
        }
      } catch {
        if (!active) return
        setQueue([])
      }
    }
    load()
    return () => {
      active = false
    }
  }, [currentTrack, queue.length, setQueue, setTrack])

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
        searchPlaceholder="어떤 장면을 틀어드릴까요?"
        onSearchChange={(e) => setInputValue(e.target.value)}
        onSearchSubmit={onSubmitSearch}
      />

      <main className="hero room-hero" data-purpose="hero-content">
        <section className="track-info" data-purpose="track-info">
          <p className="track-number">today&apos;s mood: {mood}</p>
          <h2 className="track-title">{getTitle(currentTrack)}</h2>
          <p className="artist-name">by {getArtist(currentTrack)}</p>

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
