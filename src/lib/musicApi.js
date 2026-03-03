const ITUNES_BASE = 'https://itunes.apple.com/search'

function toDuration(ms) {
  if (!ms || Number.isNaN(ms)) return '--:--'
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${String(sec).padStart(2, '0')}`
}

function mapTrack(item, idx = 0) {
  const id = String(item.trackId || `${item.collectionId || 'x'}-${idx}`)
  return {
    id,
    title: item.trackName || 'Unknown Track',
    artist: item.artistName || 'Unknown Artist',
    genre: item.primaryGenreName || 'Unknown',
    album: item.collectionName || 'Single',
    duration: toDuration(item.trackTimeMillis),
    artwork:
      item.artworkUrl100?.replace('100x100bb', '600x600bb') ||
      item.artworkUrl60 ||
      '',
    previewUrl: item.previewUrl || '',
  }
}

export async function searchTracks(query, limit = 12) {
  const q = (query || '').trim()
  if (!q) return []

  const url = `${ITUNES_BASE}?term=${encodeURIComponent(
    q
  )}&media=music&entity=song&limit=${limit}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Track search failed (${res.status})`)
  }

  const data = await res.json()
  const results = Array.isArray(data.results) ? data.results : []
  return results.map(mapTrack)
}
