# Static assets

Everything in `public/` is served from the site root. A file at
`public/images/hero/portrait.jpg` is reachable at `/images/hero/portrait.jpg`,
so that is the path used in code:

```tsx
import Image from 'next/image'

<Image src="/images/hero/portrait.jpg" alt="Malinda D. Ellis" width={1200} height={1600} />
```

## Where photos go

| Folder | What belongs there |
| --- | --- |
| `brand/` | Logo, wordmark, favicon, social share card |
| `images/hero/` | Top-of-page hero photo / background |
| `images/about/` | Portraits of Malinda for the Story section |
| `images/services/` | One photo per service — coaching, wellness, speaking |
| `images/events/` | Photos from sound baths, workshops, retreats |
| `images/gallery/` | Everything else — general photo pool |

Each folder has its own README with suggested filenames and sizes.

## Uploading from GitHub

Open the folder on GitHub → **Add file** → **Upload files** → drag the photos
in → **Commit changes**. Filenames are part of the URL, so use lowercase words
separated by hyphens: `sound-bath-2025.jpg`, not `Sound Bath (2025).JPG`.

## Before you upload

- **Format** — `.jpg` for photographs, `.png` for logos/graphics with
  transparency, `.svg` for vector logos.
- **Size** — export around 2000px on the long edge. Bigger just slows the site
  down; smaller looks soft on retina screens.
- **File weight** — keep each photo under ~500 KB where you can.
- **Rights** — only upload photos you own or are licensed to use. Anything in
  this folder is public the moment it is pushed.
