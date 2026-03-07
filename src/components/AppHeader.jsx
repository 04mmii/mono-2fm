import { Link } from 'react-router-dom'

export default function AppHeader({
  variant = 'main',
  active = 'room',
  showSearch = false,
  searchValue = '',
  searchPlaceholder = '어떤 장면을 틀어드릴까요?',
  onSearchChange,
  onSearchSubmit,
}) {
  if (variant === 'entry') {
    return (
      <div className="app-header-fixed entry">
        <header className="mono-header entry-only" data-purpose="main-nav">
          <Link to="/entry" className="brand">
            <span className="brand-icon">◉</span>
            <h1>Mono.fm</h1>
          </Link>
        </header>
      </div>
    )
  }

  return (
    <div className="app-header-fixed">
      <header className="mono-header" data-purpose="main-nav">
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
                placeholder={searchPlaceholder}
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
