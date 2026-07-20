# ============================================================
# apps/blackout-server/blackout_modules/public_profile.py
#
# Synapse module that exposes co.bmc.profile account data
# publicly at /_blackout/v1/profile/{user_id}
# without requiring authentication.
#
# Only returns the profile if public: true is set.
#
# Register in homeserver.yaml:
#
#   modules:
#     - module: blackout_modules.public_profile.PublicProfileModule
#       config: {}
#
# ============================================================

from typing import Any, Dict, Optional, Tuple

from synapse.module_api import ModuleApi
from synapse.http.server import respond_with_json
from synapse.http.site import SynapseRequest


class PublicProfileModule:
    def __init__(self, config: dict, api: ModuleApi):
        self._api = api
        api.register_web_resource(
            path="/_blackout/v1/profile/<user_id>",
            resource=PublicProfileResource(api),
        )

    @staticmethod
    def parse_config(config: dict) -> dict:
        return config


class PublicProfileResource:
    """
    GET /_blackout/v1/profile/@handle:theblackout.app
    Returns co.bmc.profile account data if public: true.
    No auth required — public endpoint.
    """

    isLeaf = True

    def __init__(self, api: ModuleApi):
        self._api = api

    async def render_GET(self, request: SynapseRequest) -> None:
        # Extract user_id from path
        path_parts = request.path.decode("utf-8").split("/")
        user_id = path_parts[-1] if path_parts else None

        if not user_id or not user_id.startswith("@"):
            request.setResponseCode(400)
            respond_with_json(request, 400, {"error": "Invalid user_id"})
            return

        try:
            # Fetch co.bmc.profile account data for this user
            account_data = await self._api._store.get_global_account_data_by_type_for_user(
                user_id=user_id,
                data_type="co.bmc.profile",
            )
        except Exception:
            account_data = None

        if not account_data:
            request.setResponseCode(404)
            respond_with_json(request, 404, {"error": "Profile not found"})
            return

        content = account_data.get("content", {}) if isinstance(account_data, dict) else {}

        # Only return if public: true
        if not content.get("public", False):
            request.setResponseCode(404)
            respond_with_json(request, 404, {"error": "Profile not public"})
            return

        # Strip any sensitive fields before returning
        safe_fields = {"bio", "pronouns", "banner", "connections", "decoration", "public"}
        safe_content = {k: v for k, v in content.items() if k in safe_fields}

        # Scrub any connection types that should stay private
        if "connections" in safe_content:
            safe_content["connections"] = [
                c for c in safe_content["connections"]
                if c.get("type") not in {"email", "phone"}
            ]

        # Add CORS headers so the public profile page can fetch this
        request.setHeader("Access-Control-Allow-Origin", "*")
        request.setHeader("Access-Control-Allow-Methods", "GET")
        request.setHeader("Cache-Control", "public, max-age=60")

        respond_with_json(request, 200, safe_content)

    def render_OPTIONS(self, request: SynapseRequest) -> bytes:
        request.setHeader("Access-Control-Allow-Origin", "*")
        request.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
        request.setResponseCode(204)
        return b""
