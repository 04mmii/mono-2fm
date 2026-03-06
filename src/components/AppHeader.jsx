import { Link } from 'react-router-dom'

export default function AppHeader({
  variant = 'main',
  active = 'room',
  showSearch = false,
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
}) {
  if (variant === 'entry') {
    return (
      <div className="app-header-fixed entry">
        <header className="entry-header">
          <Link to="/entry" className="entry-brand">
            <span className="entry-radio">◉</span>
            <h2>mono.fm</h2>
          </Link>
          <button type="button" className="entry-menu" aria-label="Menu">
            ≡
          </button>
        </header>
      </div>
    )
  }

  return (
    <div className="app-header-fixed">
      <header className={variant === 'search' ? 'search-header' : 'mono-header'} data-purpose="main-nav">
        <div className="left-nav">
          <Link to="/entry" className="brand">
            <span className="brand-icon">◉</span>
            <h1>Mono.fm</h1>
          </Link>

          <nav className={variant === 'search' ? 'nav-links' : 'main-nav'} aria-label="Primary">
            <Link to="/room" className={active === 'room' ? 'active' : ''}>
              Room
            </Link>
            <Link to="/search" className={active === 'search' ? 'active' : ''}>
              Browse
            </Link>
            <a href="#">Radio</a>
            <a href="#">Library</a>
          </nav>
        </div>

        <div className="header-right right-nav">
          {showSearch ? (
            <form className={variant === 'search' ? 'search-input-wrap' : 'search-wrap'} onSubmit={onSearchSubmit}>
              <span className={variant === 'search' ? '' : 'search-icon'}>⌕</span>
              <input
                type="text"
                value={searchValue}
                onChange={onSearchChange}
                placeholder="Search music..."
                aria-label="Search music"
              />
            </form>
          ) : null}
          <div className="avatar" aria-hidden />
        </div>
      </header>
    </div>
  )
}
