from __future__ import annotations

import os
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

import httpx

from .models import InstagramDiscoveryResponse


USERNAME_RE = re.compile(r"^[A-Za-z0-9._]{1,30}$")
RESERVED_PATHS = {"p", "reel", "reels", "tv", "stories", "explore", "accounts"}


class DiscoveryError(Exception):
    def __init__(self, *, status_code: int, code: str, message: str, retryable: bool = False, details: dict[str, object] | None = None) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        self.retryable = retryable
        self.details = details or {}
        super().__init__(message)


@dataclass(frozen=True)
class MetaDiscoverySettings:
    ig_user_id: str | None
    page_access_token: str | None
    api_version: str

    @classmethod
    def from_env(cls) -> "MetaDiscoverySettings":
        return cls(
            ig_user_id=os.getenv("CGC_META_IG_USER_ID"),
            page_access_token=os.getenv("CGC_META_PAGE_ACCESS_TOKEN"),
            api_version=os.getenv("CGC_META_API_VERSION", "v24.0"),
        )

    def missing(self) -> list[str]:
        values = {
            "CGC_META_IG_USER_ID": self.ig_user_id,
            "CGC_META_PAGE_ACCESS_TOKEN": self.page_access_token,
        }
        return [name for name, value in values.items() if not value]


def normalize_instagram_target(raw: str) -> str:
    value = raw.strip()
    if value.startswith("@"):
        value = value[1:]
    if "://" in value:
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or parsed.hostname not in {"instagram.com", "www.instagram.com"}:
            raise DiscoveryError(status_code=400, code="unsupported_target", message="Use an Instagram profile URL or username.")
        parts = [part for part in parsed.path.split("/") if part]
        if len(parts) != 1 or parts[0].lower() in RESERVED_PATHS:
            raise DiscoveryError(
                status_code=400,
                code="profile_target_required",
                message="Business Discovery currently requires a public Professional profile username or profile URL.",
            )
        value = parts[0]
    if not USERNAME_RE.fullmatch(value):
        raise DiscoveryError(status_code=400, code="invalid_instagram_username", message="The Instagram username is invalid.")
    return value.lower()


DISCOVERY_FIELDS = (
    "business_discovery.username({username})"
    "{{username,name,biography,profile_picture_url,followers_count,follows_count,media_count,"
    "media.limit(12){{id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count}}}}"
)


async def discover_public_profile(
    target: str,
    *,
    settings: MetaDiscoverySettings | None = None,
    client: httpx.AsyncClient | None = None,
) -> InstagramDiscoveryResponse:
    current = settings or MetaDiscoverySettings.from_env()
    missing = current.missing()
    if missing:
        raise DiscoveryError(
            status_code=409,
            code="meta_discovery_not_configured",
            message="Meta Business Discovery is not configured on the server.",
            details={"missing": missing},
        )
    username = normalize_instagram_target(target)
    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=20)
    try:
        response = await http_client.get(
            f"https://graph.facebook.com/{current.api_version}/{current.ig_user_id}",
            params={
                "fields": DISCOVERY_FIELDS.format(username=username),
                "access_token": current.page_access_token,
            },
        )
        response.raise_for_status()
        payload: dict[str, Any] = response.json()
        profile = payload.get("business_discovery")
        if not isinstance(profile, dict) or not profile.get("username"):
            raise DiscoveryError(
                status_code=404,
                code="professional_profile_unavailable",
                message="Meta did not return an eligible public Business or Creator profile.",
            )
        media = profile.get("media")
        profile["media"] = media.get("data", []) if isinstance(media, dict) else []
    except DiscoveryError:
        raise
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        raise DiscoveryError(
            status_code=502 if status >= 500 else 424,
            code="meta_discovery_failed",
            message="Meta could not return the requested public Professional profile.",
            retryable=status >= 500 or status == 429,
            details={"meta_status": status},
        ) from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise DiscoveryError(status_code=502, code="meta_discovery_failed", message="Meta Business Discovery request failed.", retryable=True) from exc
    finally:
        if owns_client:
            await http_client.aclose()

    availability_fields = ["name", "biography", "profile_picture_url", "followers_count", "follows_count", "media_count"]
    unavailable = [field for field in availability_fields if profile.get(field) is None]
    return InstagramDiscoveryResponse.model_validate(
        {
            "status": "completed",
            "provider": "meta_business_discovery",
            "sample_data": False,
            "target_username": username,
            "retrieved_at": datetime.now(timezone.utc).isoformat(),
            "profile": profile,
            "unavailable_fields": unavailable,
            "limitations": [
                "Only public fields returned by Meta for eligible Business or Creator accounts are included.",
                "Private Insights such as reach, saves, shares, retention, audience, and conversions are unavailable for another account.",
            ],
        }
    )
