import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const PlayerContext = createContext(null)

function getAudioSrc(track) {
  if (!track || typeof track !== 'object') return ''

  const candidates = [
    track.previewUrl,
    track.audioUrl,
    track.streamUrl,
    track.trackUrl,
    track.url,
    track.audio?.url,
  ]

  const src = candidates.find((value) => typeof value === 'string' && value.length > 0)
  return src || ''
}

export function PlayerProvider({ children }) {
  const audioRef = useRef(null)
  const [currentTrack, setCurrentTrackState] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const pause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    setIsPlaying(false)
  }, [])

  const setTrack = useCallback((track) => {
    setCurrentTrackState(track || null)
    setCurrentTime(0)
    setDuration(0)
  }, [])

  const play = useCallback(async (track) => {
    const audio = audioRef.current
    if (!audio) return

    const trackToPlay = track || currentTrack
    if (!trackToPlay) return

    const nextSrc = getAudioSrc(trackToPlay)
    if (!nextSrc) {
      setCurrentTrackState(trackToPlay)
      setIsPlaying(false)
      return
    }

    if (audio.src !== nextSrc) {
      audio.src = nextSrc
    }

    if (track) {
      setCurrentTrackState(trackToPlay)
      setCurrentTime(0)
      setDuration(0)
    }

    try {
      await audio.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }, [currentTrack])

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause()
      return
    }
    play()
  }, [isPlaying, pause, play])

  const seek = useCallback((time) => {
    const audio = audioRef.current
    if (!audio || Number.isNaN(time)) return
    const clamped = Math.max(0, Math.min(time, Number.isFinite(duration) ? duration : time))
    audio.currentTime = clamped
    setCurrentTime(clamped)
  }, [duration])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTime = () => setCurrentTime(audio.currentTime || 0)
    const onLoaded = () => setDuration(audio.duration || 0)
    const onEnded = () => setIsPlaying(false)
    const onPause = () => setIsPlaying(false)
    const onPlay = () => setIsPlaying(true)

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('play', onPlay)

    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('play', onPlay)
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    const nextSrc = getAudioSrc(currentTrack)
    if (!nextSrc) return
    if (audio.src !== nextSrc) {
      audio.src = nextSrc
      audio.load()
    }
  }, [currentTrack])

  const value = useMemo(() => ({
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    toggle,
    seek,
    setTrack,
    getAudioSrc,
  }), [currentTime, currentTrack, duration, isPlaying, pause, play, seek, setTrack, toggle])

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" />
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error('usePlayer must be used inside PlayerProvider')
  }
  return context
}
