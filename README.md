# Shakti Innergy

Standalone website for **Shakti Innergy** — holistic life & wellness coaching, sound
healing, and motivational speaking by **Malinda D. Ellis** (Columbia, SC). Replaces the
WordPress build at shaktiinnergy.com.

Built with **Next.js (App Router)**, deployed on **Vercel**, and connected to the wider
ecosystem through public APIs:

- **FreeBlackMarket** — events (ticketing) and offerings render from the public vendor
  catalog: `GET https://api.freeblackmarket.com/store/vendors/{handle}` (no auth).
- **Blackout** — "Message on Blackout" deep links to `chat.theblackout.app`, and the
  connect band enriches itself from the public profile endpoints on
  `matrix.theblackout.app` when Malinda's profile is public.
- **Supabase** — client scaffolded (`lib/supabase.ts`) for future booking-inquiry /
  contact-form storage; no feature uses it yet.

Both integrations **fail soft**: the site renders completely even when FBM or Blackout
is unreachable.

## Develop

```bash
npm install
cp .env.example .env.local   # then fill in handles / keys
npm run dev
```

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_FBM_HANDLE` | FreeBlackMarket vendor handle for the storefront | `shaktiinnergy` |
| `NEXT_PUBLIC_BLACKOUT_HANDLE` | Blackout handle → `@{handle}:theblackout.app` | `malinda` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (scaffold) | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (scaffold) | — |

## Deploy (Vercel)

1. Import the repo in Vercel — Next.js is auto-detected, no config needed.
2. Set the environment variables above in Project Settings → Environment Variables.
3. Point the `shaktiinnergy.com` domain at the Vercel project.

Catalog and profile data revalidate every 5 minutes (ISR) — no rebuild needed when
events or products change on FreeBlackMarket.

## Structure

```
app/            layout, globals.css, page (server component)
components/     Header, Hero, Story, Services, Storefront, BlackoutConnect, Contact, Footer
lib/            config, fbm (store API), blackout (profile API), supabase (scaffold)
public/         static assets served from the site root — see public/README.md
```

## Photos

Site imagery lives in `public/`, served from the root (`public/images/hero/hero.jpg`
→ `/images/hero/hero.jpg`):

```
public/brand/             logo, favicon, social share card
public/images/hero/       top-of-page hero photo
public/images/about/      portraits for the Story section
public/images/services/   one photo per service block
public/images/events/     sound baths, workshops, retreats
public/images/gallery/    general photo pool
```

Each folder's README lists the suggested filenames and sizes. Photos can be
dropped in through the GitHub UI (**Add file → Upload files**); nothing is wired
into the components until the files are there.
