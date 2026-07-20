import { BLACKOUT_USER_ID } from '@/lib/config'
import { messageLink } from '@/lib/blackout'

export function Header() {
  return (
    <header className="site-header">
      <div className="container inner">
        <a href="#top" className="wordmark">
          Shakti <span>Innergy</span>
        </a>
        <nav className="site-nav">
          <a className="nav-link" href="#story">
            Story
          </a>
          <a className="nav-link" href="#services">
            Services
          </a>
          <a className="nav-link" href="#events">
            Events
          </a>
          <a className="nav-link" href="#offerings">
            Offerings
          </a>
          <a className="nav-link" href="#contact">
            Contact
          </a>
          <a
            className="btn btn-teal"
            style={{ padding: '0.55rem 1.1rem', fontSize: '0.7rem' }}
            href={messageLink(BLACKOUT_USER_ID)}
            target="_blank"
            rel="noreferrer"
          >
            Message on Blackout
          </a>
        </nav>
      </div>
    </header>
  )
}
