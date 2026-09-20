import { Link } from 'react-router-dom'

export default function AppHeader({
  variant = 'main',
  active = 'room',
  showSearch = false,
  searchValue = '',
  searchPlaceholder = '오늘, 어떤 온도의 음악을 들을까요?',
  searchAriaLabel = 'Search music',
  onSearchChange,
  onSearchSubmit,
}) {
  if (variant === 'entry') {
    return (
      <div className="app-header-fixed entry">
        <header className="mono-header entry-only" data-purpose="main-nav">
          <Link to="/entry" className="brand">
            <span className="brand-icon">◉</span>
            <h1>MONO.fm</h1>
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
            <h1>MONO.fm</h1>
          </Link>

          <nav className={variant === 'search' ? 'nav-links' : 'main-nav'} aria-label="Primary">
            <Link to="/room" className={active === 'room' ? 'active' : ''}>
              Room
            </Link>
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
                aria-label={searchAriaLabel}
              />
            </form>
          ) : null}
          <div className="avatar" aria-hidden />
        </div>
      </header>
    </div>
  )
}
