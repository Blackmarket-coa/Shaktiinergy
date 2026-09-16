# Brand

Logo and identity files — not photography.

| Suggested filename | Purpose | Size |
| --- | --- | --- |
| `logo.svg` | Primary logo, vector (preferred) | any |
| `logo.png` | Primary logo, transparent background | 1000px wide |
| `logo-light.png` | Version for dark backgrounds | 1000px wide |
| `favicon.png` | Browser tab icon, square | 512 × 512 |
| `og-card.jpg` | Link preview when the site is shared | 1200 × 630 |

**Wired:** `og-card.jpg` — referenced by `app/layout.tsx` as the Open Graph
and Twitter card image. The current file is a 1200 × 630 crop of
`images/services/wellness-coaching.jpg`; replace it with a purpose-made card
(a photo with the wordmark over it works well) whenever one exists.

The logo and favicon files above are still missing. Next.js picks up a favicon
automatically from `app/icon.png` — that is where a square icon should go, not
this folder.
