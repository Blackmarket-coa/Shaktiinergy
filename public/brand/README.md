# Brand

Logo and identity files — not photography.

| File | Purpose | Status |
| --- | --- | --- |
| `logo.jpg` | Full logo lockup, 1080 × 1080 | stored |
| `og-card.jpg` | Link preview when the site is shared, 1200 × 630 | wired |
| `logo-transparent.png` | Logo on a transparent background | **missing** |

`logo.jpg` has a solid white background, so it cannot sit on the site's dark
plum canvas without showing as a white square. That is why the header still
uses the text wordmark. A transparent PNG (or a version drawn for dark
backgrounds) is what that would need.

**Wired:** `og-card.jpg` — referenced by `app/layout.tsx` as the Open Graph
and Twitter card image. The current file is a 1200 × 630 crop of
`images/services/wellness-coaching.jpg`; replace it with a purpose-made card
(a photo with the wordmark over it works well) whenever one exists.

**Favicon:** generated from `logo.jpg` and stored at `app/icon.png` (512 × 512)
and `app/apple-icon.png` (180 × 180) — Next.js picks those up by filename, so
they live in `app/`, not this folder. They are a padded square crop of the
emblem with the wordmark excluded, since the text is unreadable at tab size.
Regenerate them if the logo changes.
