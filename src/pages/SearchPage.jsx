import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { searchTracks } from '../lib/musicApi'
import { usePlayer } from '../player/PlayerProvider'

const FILTERS = ['All', 'Tracks', 'Artists', 'Albums', 'Playlists']
const RECOMMENDED_QUERIES = ['late night jazz', 'warm vinyl', 'quiet piano', 'city rain', 'sunday soul']

export default function SearchPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const player = usePlayer()
  const [activeFilter, setActiveFilter] = useState('All')
  const initialQuery = (params.get('q') || '').trim()
  const [query, setQuery] = useState(initialQuery)
  const [inputValue, setInputValue] = useState(initialQuery)
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recommendedTracks, setRecommendedTracks] = useState([])
  const [recommendLoading, setRecommendLoading] = useState(false)

  useEffect(() => {
    const next = (params.get('q') || '').trim()
    setQuery(next)
    setInputValue(next)
  }, [params])

  useEffect(() => {
    if (!query) {
      setTracks([])
      setLoading(false)
      setError('')
      return
    }

    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await searchTracks(query, 24)
        if (!active) return
        setTracks(data)
      } catch (e) {
        if (!active) return
        setTracks([])
        setError(e instanceof Error ? e.message : 'Failed to search tracks')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [query])

  useEffect(() => {
    let active = true
    const loadRecommendations = async () => {
      setRecommendLoading(true)
      try {
        const data = await searchTracks('vinyl lounge', 8)
        if (!active) return
        setRecommendedTracks(data)
      } catch {
        if (!active) return
        setRecommendedTracks([])
      } finally {
        if (active) setRecommendLoading(false)
      }
    }
    loadRecommendations()
    return () => {
      active = false
    }
  }, [])

  const onSubmitSearch = (event) => {
    event.preventDefault()
    const nextQuery = inputValue.trim()
    if (!nextQuery) {
      setParams({})
      return
    }
    setParams({ q: nextQuery })
  }

  const topResults = useMemo(() => tracks.slice(0, 3), [tracks])
  const trackRows = useMemo(() => tracks.slice(0, 12), [tracks])

  const collections = useMemo(() => {
    const map = new Map()
    for (const song of tracks) {
      if (!map.has(song.album)) map.set(song.album, song)
    }
    return Array.from(map.values()).slice(0, 8)
  }, [tracks])

  const showTopResults = activeFilter === 'All'
  const showTracks = activeFilter === 'All' || activeFilter === 'Tracks'
  const showCollections = activeFilter === 'All' || activeFilter === 'Albums' || activeFilter === 'Playlists'
  const showArtistEmpty = activeFilter === 'Artists'
  const isBrowseMode = !query

  const resultSummary = `${tracks.length} matches found across sounds and atmospheres`

  const onPlay = (track, sourceTracks = []) => {
    if (!track) return
    if (Array.isArray(sourceTracks) && sourceTracks.length > 0) {
      player.setQueue(sourceTracks)
    } else {
      player.setQueue([track])
    }
    player.play(track)
    navigate('/room', { state: { from: 'search' } })
  }

  const onClickRecommendation = (nextQuery) => {
    setInputValue(nextQuery)
    setParams({ q: nextQuery })
  }

  return (
    <div className="search-page">
      <div className="grain-overlay" />
      <AppHeader
        variant="search"
        active="search"
        showSearch
        searchValue={inputValue}
        searchPlaceholder="어떤 장면을 틀어드릴까요?"
        onSearchChange={(e) => setInputValue(e.target.value)}
        onSearchSubmit={onSubmitSearch}
      />

      <main className="search-main">
        <div className="breadcrumb">
          <Link to="/room">← Back to Home</Link>
        </div>

        <div className="results-heading">
          <h2>{isBrowseMode ? 'Browse' : `Results for '${query}'`}</h2>
          <p>
            {isBrowseMode
              ? 'Start with a mood and pick from recommended playlists'
              : loading
                ? 'Searching...'
                : resultSummary}
          </p>
        </div>

        {isBrowseMode ? (
          <section className="section-block browse-section">
            <h3>Recommended Playlists</h3>

            <div className="recommend-chip-row">
              {RECOMMENDED_QUERIES.map((keyword) => (
                <button key={keyword} type="button" onClick={() => onClickRecommendation(keyword)}>
                  {keyword}
                </button>
              ))}
            </div>

            {recommendLoading ? <p className="empty-copy">Curating recommendations...</p> : null}

            {!recommendLoading && recommendedTracks.length === 0 ? (
              <p className="empty-copy">No recommendation right now. Try typing your mood above.</p>
            ) : null}

            {!recommendLoading && recommendedTracks.length > 0 ? (
              <div className="tracks-table">
                <div className="table-head">
                  <span>#</span>
                  <span>Title</span>
                  <span>Artist</span>
                  <span>Time</span>
                </div>
                {recommendedTracks.map((track) => (
                  <div key={`recommend-${track.id}`} className="track-row">
                    <button
                      type="button"
                      className="row-play"
                      onClick={() => onPlay(track, recommendedTracks)}
                      aria-label={`Play ${track.title}`}
                    >
                      <span className="icon-play" aria-hidden />
                    </button>
                    <span className="row-title">{track.title}</span>
                    <span className="row-artist">{track.artist}</span>
                    <span className="row-time">{track.duration}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : (
          <>
            <div className="filters" role="tablist" aria-label="Search filters">
              {FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={activeFilter === filter ? 'active' : ''}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            {error ? <p className="error-copy">{error}</p> : null}
            {!loading && !error && tracks.length === 0 ? (
              <p className="empty-copy">No results found. Try another keyword.</p>
            ) : null}

            {showTopResults && (
              <section className="section-block">
                <h3>Top Results</h3>
                <div className="top-results-grid">
                  {topResults.map((item) => (
                    <article key={item.id} className="result-card">
                      <div className="cover" style={{ backgroundImage: `url('${item.artwork}')` }} />
                      <h4>{item.title}</h4>
                      <p>{item.artist}</p>
                      <button type="button" className="inline-play" onClick={() => onPlay(item, tracks)}>
                        Play
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {showTracks && (
              <section className="section-block">
                <h3>Tracks</h3>
                <div className="tracks-table">
                  <div className="table-head">
                    <span>#</span>
                    <span>Title</span>
                    <span>Artist</span>
                    <span>Time</span>
                  </div>
                  {trackRows.map((track) => (
                    <div key={track.id} className="track-row">
                      <button
                        type="button"
                        className="row-play"
                        onClick={() => onPlay(track, tracks)}
                        aria-label={`Play ${track.title}`}
                      >
                        <span className="icon-play" aria-hidden />
                      </button>
                      <span className="row-title">{track.title}</span>
                      <span className="row-artist">{track.artist}</span>
                      <span className="row-time">{track.duration}</span>
                    </div>
                  ))}
                </div>
                <div className="section-action">
                  <button
                    type="button"
                    onClick={() => onPlay(trackRows[0], tracks)}
                    disabled={trackRows.length === 0}
                  >
                    Play
                  </button>
                </div>
              </section>
            )}

            {showCollections && (
              <section className="section-block section-last">
                <h3>Albums & Playlists</h3>
                <div className="collections-row">
                  {collections.map((item) => (
                    <article key={`${item.album}-${item.id}`} className="collection-card">
                      <div className="cover" style={{ backgroundImage: `url('${item.artwork}')` }} />
                      <h4>{item.album}</h4>
                      <p>Album • {item.artist}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {showArtistEmpty && (
              <section className="section-block section-last">
                <h3>Artists</h3>
                <p className="empty-copy">Artist filter view is coming next. Use All/Tracks for now.</p>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
