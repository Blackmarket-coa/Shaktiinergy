import { FBM_STORE, SITE } from '@/lib/config'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container inner">
        <div>
          © {new Date().getFullYear()} {SITE.name} · Malinda D. Ellis
        </div>
        <div className="partners">
          <a href="https://theblackout.app" target="_blank" rel="noreferrer">
            Blackout
          </a>
          <a href={FBM_STORE} target="_blank" rel="noreferrer">
            FreeBlackMarket
          </a>
        </div>
      </div>
    </footer>
  )
}
