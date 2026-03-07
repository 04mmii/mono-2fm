import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const PlayerContext = createContext(null)

function firstText(values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function getTrackKey(track) {
  if (!track || typeof track !== 'object') return ''
  return firstText([
    track.id != null ? String(track.id) : '',
    track.trackId != null ? String(track.trackId) : '',
    track.previewUrl,
    track.audioUrl,
    track.streamUrl,
    track.trackUrl,
    track.url,
    track.src,
    track.title,
    track.name,
    track.trackName,
  ])
}

function sameTrack(a, b) {
  const aKey = getTrackKey(a)
  const bKey = getTrackKey(b)
  if (!aKey || !bKey) return false
  return aKey === bKey
}

export function getAudioSrc(track) {
  if (!track || typeof track !== 'object') return ''
  return firstText([
    track.previewUrl,
    track.audioUrl,
    track.streamUrl,
    track.trackUrl,
    track.url,
    track.src,
    track.audio?.url,
    track.attributes?.previews?.[0]?.url,
  ])
}

export function PlayerProvider({ children }) {
  const audioRef = useRef(null)

  const [currentTrack, setCurrentTrackState] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [queue, setQueueState] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)

  const setCurrentTrack = useCallback(
    (track) => {
      setCurrentTrackState(track || null)
      if (!track) {
        setCurrentIndex(-1)
        return
      }

      setCurrentIndex((prev) => {
        const idx = queue.findIndex((item) => sameTrack(item, track))
        if (idx >= 0) return idx
        return prev
      })
    },
    [queue]
  )

  const setQueue = useCallback(
    (tracks) => {
      const nextQueue = Array.isArray(tracks) ? tracks.filter(Boolean) : []
      setQueueState(nextQueue)

      if (nextQueue.length === 0) {
        setCurrentIndex(-1)
        return
      }

      if (!currentTrack) {
        setCurrentTrackState(nextQueue[0])
        setCurrentIndex(0)
        return
      }

      const idx = nextQueue.findIndex((item) => sameTrack(item, currentTrack))
      setCurrentIndex(idx >= 0 ? idx : 0)
    },
    [currentTrack]
  )

  const play = useCallback(
    (track) => {
      const targetTrack = track || currentTrack || queue[Math.max(currentIndex, 0)] || null
      if (!targetTrack) return

      if (track) {
        setCurrentTrackState(track)
        const idx = queue.findIndex((item) => sameTrack(item, track))
        if (idx >= 0) setCurrentIndex(idx)
        if (idx < 0 && queue.length === 0) {
          setQueueState([track])
          setCurrentIndex(0)
        }
      }

      if (!track && !currentTrack && queue.length > 0) {
        setCurrentTrackState(queue[Math.max(currentIndex, 0)])
      }

      setIsPlaying(true)
    },
    [currentIndex, currentTrack, queue]
  )

  const pause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const toggle = useCallback(() => {
    if (!currentTrack && queue.length > 0) {
      setCurrentTrackState(queue[Math.max(currentIndex, 0)])
    }
    setIsPlaying((prev) => !prev)
  }, [currentIndex, currentTrack, queue])

  const seek = useCallback((time) => {
    const audio = audioRef.current
    if (!audio) return
    const nextTime = Number(time)
    if (!Number.isFinite(nextTime)) return
    audio.currentTime = Math.max(0, nextTime)
    setCurrentTime(audio.currentTime || 0)
  }, [])

  const playNext = useCallback(() => {
    if (queue.length === 0) return

    const baseIndex =
      currentIndex >= 0
        ? currentIndex
        : queue.findIndex((item) => sameTrack(item, currentTrack))
    const nextIndex = baseIndex >= 0 ? (baseIndex + 1) % queue.length : 0
    const next = queue[nextIndex]
    if (!next) return

    setCurrentTrackState(next)
    setCurrentIndex(nextIndex)
  }, [currentIndex, currentTrack, queue])

  const playPrev = useCallback(() => {
    if (queue.length === 0) return

    const baseIndex =
      currentIndex >= 0
        ? currentIndex
        : queue.findIndex((item) => sameTrack(item, currentTrack))
    const prevIndex = baseIndex >= 0 ? (baseIndex - 1 + queue.length) % queue.length : queue.length - 1
    const prev = queue[prevIndex]
    if (!prev) return

    setCurrentTrackState(prev)
    setCurrentIndex(prevIndex)
  }, [currentIndex, currentTrack, queue])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const src = getAudioSrc(currentTrack)
    if (!src) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      setCurrentTime(0)
      setDuration(0)
      if (isPlaying) setIsPlaying(false)
      return
    }

    if (audio.getAttribute('src') !== src) {
      audio.setAttribute('src', src)
      audio.load()
      setCurrentTime(0)
    }

    if (isPlaying) {
      const playPromise = audio.play()
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          setIsPlaying(false)
        })
      }
    } else {
      audio.pause()
    }
  }, [currentTrack, isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0)
    }

    const handleDurationChange = () => {
      const nextDuration = Number.isFinite(audio.duration) ? audio.duration : 0
      setDuration(nextDuration)
    }

    const handleEnded = () => {
      if (queue.length > 1) {
        const baseIndex =
          currentIndex >= 0
            ? currentIndex
            : queue.findIndex((item) => sameTrack(item, currentTrack))
        const nextIndex = baseIndex >= 0 ? (baseIndex + 1) % queue.length : 0
        const next = queue[nextIndex]
        if (next) {
          setCurrentTrackState(next)
          setCurrentIndex(nextIndex)
          setIsPlaying(true)
          return
        }
      }
      setIsPlaying(false)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('loadedmetadata', handleDurationChange)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('loadedmetadata', handleDurationChange)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [currentIndex, currentTrack, queue])

  const nextTrack = useMemo(() => {
    if (!queue.length) return null
    const baseIndex =
      currentIndex >= 0
        ? currentIndex
        : queue.findIndex((item) => sameTrack(item, currentTrack))
    if (baseIndex < 0) return queue[0] || null
    return queue[(baseIndex + 1) % queue.length] || null
  }, [currentIndex, currentTrack, queue])

  const value = useMemo(
    () => ({
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      queue,
      currentIndex,
      nextTrack,
      play,
      pause,
      toggle,
      seek,
      setTrack: setCurrentTrack,
      setQueue,
      playNext,
      playPrev,
    }),
    [
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      queue,
      currentIndex,
      nextTrack,
      play,
      pause,
      toggle,
      seek,
      setCurrentTrack,
      setQueue,
      playNext,
      playPrev,
    ]
  )

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" style={{ display: 'none' }} />
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
