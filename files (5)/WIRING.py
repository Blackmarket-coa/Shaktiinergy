# ============================================================
# WIRING GUIDE — Public Profile System
# ============================================================

# ── 1. React Router (apps/web/src/app/Router.tsx) ──────────
# Add this route. The /@:handle path must be BEFORE any
# catch-all routes. The PublicProfile page is fully static
# (no auth required) so it can be loaded by anyone.
#
# import { PublicProfile } from './pages/PublicProfile'
#
# <Route path="/@:handle" element={<PublicProfile />} />
#
# Existing protected routes stay as-is — this only adds
# the public /@handle path.


# ── 2. Settings integration (Settings.tsx sidebar) ─────────
# In apps/web/src/app/features/settings/Settings.tsx,
# add a "Public Profile" section to the Profile settings page.
#
# import { ProfilePublicSettings } from
#   './profile/ProfilePublicSettings'
#
# Place it at the bottom of the Profile settings page,
# after the existing ProfileEditor component.
# It uses the same folds components — no layout changes needed.


# ── 3. Synapse module (homeserver.yaml) ────────────────────
#
# modules:
#   - module: blackout_modules.public_profile.PublicProfileModule
#     config: {}
#
# Copy public_profile.py to:
#   apps/blackout-server/blackout_modules/public_profile.py
# Then rebuild the Synapse image:
#   docker build -f Dockerfile.blackout-synapse -t blackout-synapse:stable .
#   cd /opt/blackout-infra && docker compose up -d --force-recreate synapse


# ── 4. Nginx — route /@handle to the Cinny frontend ────────
# In your nginx.conf (served by the frontend container),
# add this location block so /@handle URLs load the React app
# and React Router handles the rest:
#
# server {
#   ...existing config...
#
#   # Public profile pages — serve React app, let Router handle
#   location ~ ^/@[^/]+ {
#     try_files $uri /index.html;
#   }
# }
#
# The React app at /index.html already loads; the /@:handle
# route in React Router catches it from there.


# ── 5. SEO / Open Graph (optional but recommended) ─────────
# For link previews when someone shares a profile URL,
# add a server-side meta tag injector. The simplest approach
# is an nginx sub_filter or a tiny Express middleware that
# reads the Matrix profile and injects OG tags before
# serving index.html.
#
# Nginx approach (add to location block above):
#
#   location ~ ^/@(?<handle>[^/]+)$ {
#     proxy_pass http://profile-meta-service:3001;
#     # Falls back to index.html on error
#     error_page 502 503 = @fallback;
#   }
#   location @fallback {
#     try_files /index.html =404;
#   }
#
# The meta service is a ~30-line Express app that fetches
# the Matrix profile and returns index.html with OG tags
# injected. Worth building after the MVP is live.


# ── 6. FBM Connect link format ─────────────────────────────
# When a Blackout user links their FBM handle, the public
# profile page calls:
#   GET https://api.freeblackmarket.com/store/vendors/{fbmHandle}
#
# This is the same endpoint connect.js uses.
# No additional FBM changes needed — the CORS allowlist
# already permits cross-origin reads on the store API.
# (The allowed_origins check is only enforced on the
#  /vendor/ authenticated routes, not /store/.)
