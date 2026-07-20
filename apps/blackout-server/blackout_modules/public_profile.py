# ============================================================
# apps/blackout-server/blackout_modules/public_profile.py
#
# Synapse module that exposes a user's co.bmc.profile account data
# publicly (no auth) at:
#
#     GET /_blackout/v1/profile/{user_id}
#
# The profile is only served when its content has `public: true`.
# Only a safe allow-list of fields is returned, and the `email` /
# `phone` connection entries are stripped so private contact info
# never reaches an anonymous visitor.
#
# ── WIRING (Deliverable 4.3) ────────────────────────────────
# Register the module in homeserver.yaml:
#
#     modules:
#       - module: blackout_modules.public_profile.PublicProfileModule
#         config: {}
#
# Rebuild + redeploy the Synapse image (Deliverable 4.5):
#
#     docker build -f Dockerfile.blackout-synapse -t blackout-synapse:stable .
#     cd /opt/blackout-infra && docker compose up -d --force-recreate synapse
# ============================================================

import logging
from typing import Any, Dict
from urllib.parse import unquote

from synapse.http.server import DirectServeJsonResource, respond_with_json
from synapse.http.site import SynapseRequest
from synapse.module_api import ModuleApi

logger = logging.getLogger(__name__)

# Fields that are safe to expose on an anonymous public profile.
_SAFE_FIELDS = {"bio", "pronouns", "banner", "connections", "decoration", "public"}
# Connection types that must never be exposed publicly.
_PRIVATE_CONNECTION_TYPES = {"email", "phone"}

_ACCOUNT_DATA_TYPE = "co.bmc.profile"
_MOUNT_PATH = "/_blackout/v1/profile"


class PublicProfileModule:
    """Third-party Synapse module. Instantiated once at server startup."""

    def __init__(self, config: Dict[str, Any], api: ModuleApi):
        self._api = api
        # Register the resource. It is a leaf, so it handles every request
        # under the mount path — the trailing {user_id} arrives in postpath.
        api.register_web_resource(
            path=_MOUNT_PATH,
            resource=PublicProfileResource(api),
        )
        logger.info("PublicProfileModule registered at %s/{user_id}", _MOUNT_PATH)

    @staticmethod
    def parse_config(config: Dict[str, Any]) -> Dict[str, Any]:
        # No configuration options today; return as-is so Synapse validates cleanly.
        return config or {}


class PublicProfileResource(DirectServeJsonResource):
    """
    GET /_blackout/v1/profile/@handle:theblackout.app

    Returns the safe subset of co.bmc.profile account data when the profile
    is marked public. Extending DirectServeJsonResource gives us proper
    async request handling, JSON error responses, and cancellation support.
    """

    isLeaf = True

    def __init__(self, api: ModuleApi):
        super().__init__()
        self._api = api

    def _set_cors(self, request: SynapseRequest) -> None:
        request.setHeader(b"Access-Control-Allow-Origin", b"*")
        request.setHeader(b"Access-Control-Allow-Methods", b"GET, OPTIONS")
        request.setHeader(b"Access-Control-Allow-Headers", b"Content-Type")

    async def _async_render_GET(self, request: SynapseRequest) -> None:
        # The user id is whatever path segment(s) follow the mount point.
        # e.g. request for /_blackout/v1/profile/@malinda:theblackout.app
        #      -> postpath == [b"@malinda:theblackout.app"]
        raw = b"/".join(request.postpath) if request.postpath else b""
        user_id = unquote(raw.decode("utf-8")).strip("/")

        self._set_cors(request)

        if not user_id or not user_id.startswith("@") or ":" not in user_id:
            respond_with_json(request, 400, {"error": "Invalid user_id"}, send_cors=False)
            return

        try:
            account_data = await self._api._store.get_global_account_data_by_type_for_user(
                user_id=user_id,
                data_type=_ACCOUNT_DATA_TYPE,
            )
        except Exception:
            logger.exception("Failed to load %s for %s", _ACCOUNT_DATA_TYPE, user_id)
            account_data = None

        # get_global_account_data_by_type_for_user returns the content dict
        # directly (or None). Older stores wrap it as {"content": {...}} — handle both.
        content: Dict[str, Any] = {}
        if isinstance(account_data, dict):
            content = account_data.get("content", account_data)

        if not content:
            respond_with_json(request, 404, {"error": "Profile not found"}, send_cors=False)
            return

        # Gate: only public profiles are served. Anything else is a 404 so the
        # endpoint never reveals whether a private profile exists.
        if content.get("public") is not True:
            respond_with_json(request, 404, {"error": "Profile not found"}, send_cors=False)
            return

        safe_content = {k: v for k, v in content.items() if k in _SAFE_FIELDS}

        # Scrub private connection types (email / phone).
        connections = safe_content.get("connections")
        if isinstance(connections, list):
            safe_content["connections"] = [
                c
                for c in connections
                if isinstance(c, dict) and c.get("type") not in _PRIVATE_CONNECTION_TYPES
            ]

        request.setHeader(b"Cache-Control", b"public, max-age=60")
        respond_with_json(request, 200, safe_content, send_cors=False)

    async def _async_render_OPTIONS(self, request: SynapseRequest) -> None:
        # CORS preflight.
        self._set_cors(request)
        request.setHeader(b"Access-Control-Max-Age", b"86400")
        respond_with_json(request, 200, {}, send_cors=False)
