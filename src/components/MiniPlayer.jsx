import { useMemo } from 'react'
import { usePlayer } from '../player/PlayerProvider'

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const min = Math.floor(total / 60)
  const sec = total % 60
  return `${min}:${String(sec).padStart(2, '0')}`
}

function getTrackTitle(track) {
  if (!track) return 'No track selected'
  return track.title || track.name || track.trackName || 'Unknown title'
}

function getTrackArtist(track) {
  if (!track) return '-'
  return track.artist || track.artistName || track.author || '-'
}

export default function MiniPlayer() {
  const { currentTrack, isPlaying, currentTime, duration, toggle, seek } = usePlayer()

  const progress = useMemo(() => {
    if (!duration) return 0
    return Math.max(0, Math.min(100, (currentTime / duration) * 100))
  }, [currentTime, duration])

  const onSeek = (event) => {
    if (!duration) return
    const value = Number(event.target.value)
    if (Number.isNaN(value)) return
    seek((value / 100) * duration)
  }

  return (
    <footer className="mini-player" data-purpose="global-mini-player">
      <div className="mini-left">
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          onChange={onSeek}
          aria-label="Seek"
        />
        <span>{formatTime(duration)}</span>
      </div>

      <div className="mini-center-controls">
        <button type="button" className="mini-side-btn" aria-label="Previous">
          <span className="icon-prev" aria-hidden />
        </button>
        <button type="button" className="mini-play-toggle" onClick={toggle} aria-label={isPlaying ? 'Pause' : 'Play'}>
          <span className={isPlaying ? 'icon-pause' : 'icon-play'} aria-hidden />
        </button>
        <button type="button" className="mini-side-btn" aria-label="Next">
          <span className="icon-next" aria-hidden />
        </button>
      </div>

      <div className="mini-right">
        <span>NEXT IN QUEUE</span>
        <p>
          {getTrackTitle(currentTrack)} — {getTrackArtist(currentTrack)}
        </p>
      </div>
    </footer>
  )
}
