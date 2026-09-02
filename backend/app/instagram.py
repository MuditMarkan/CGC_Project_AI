from __future__ import annotations

import os
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlencode

import httpx

from .database import Database
from .models import InstagramAccountSummary, InstagramConnectResponse


REQUIRED_SCOPES = ["instagram_business_basic", "instagram_business_manage_insights"]


class InstagramIntegrationError(Exception):
    def __init__(
        self,
        *,
        status_code: int,
        code: str,
        message: str,
        retryable: bool = False,
        details: dict[str, object] | None = None,
    ) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        self.retryable = retryable
        self.details = details or {}
        super().__init__(message)


@dataclass(frozen=True)
class InstagramSettings:
    app_id: str | None
    app_secret: str | None
    redirect_uri: str | None
    api_version: str | None
    token_encryption_key: str | None
    frontend_url: str

    @classmethod
    def from_env(cls) -> "InstagramSettings":
        return cls(
            app_id=os.getenv("CGC_INSTAGRAM_APP_ID"),
            app_secret=os.getenv("CGC_INSTAGRAM_APP_SECRET"),
            redirect_uri=os.getenv("CGC_INSTAGRAM_REDIRECT_URI"),
            api_version=os.getenv("CGC_INSTAGRAM_API_VERSION"),
            token_encryption_key=os.getenv("CGC_TOKEN_ENCRYPTION_KEY"),
            frontend_url=os.getenv("CGC_FRONTEND_URL", "http://localhost:3000"),
        )

    def missing(self) -> list[str]:
        values = {
            "CGC_INSTAGRAM_APP_ID": self.app_id,
            "CGC_INSTAGRAM_APP_SECRET": self.app_secret,
            "CGC_INSTAGRAM_REDIRECT_URI": self.redirect_uri,
            "CGC_INSTAGRAM_API_VERSION": self.api_version,
            "CGC_TOKEN_ENCRYPTION_KEY": self.token_encryption_key,
        }
        return [name for name, value in values.items() if not value]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def configuration_error(settings: InstagramSettings) -> InstagramIntegrationError:
    return InstagramIntegrationError(
        status_code=409,
        code="instagram_not_configured",
        message="Instagram connection is not configured on the server.",
        details={"missing": settings.missing()},
    )


def begin_instagram_connection(database: Database, settings: InstagramSettings) -> InstagramConnectResponse:
    if settings.missing():
        raise configuration_error(settings)
    now = utc_now()
    expires = now + timedelta(minutes=10)
    state = secrets.token_urlsafe(32)
    database.save_oauth_state(state, expires.isoformat())
    query = urlencode(
        {
            "client_id": settings.app_id,
            "redirect_uri": settings.redirect_uri,
            "response_type": "code",
            "scope": ",".join(REQUIRED_SCOPES),
            "state": state,
        }
    )
    return InstagramConnectResponse(
        authorization_url=f"https://www.instagram.com/oauth/authorize?{query}",
        state_expires_at=expires.isoformat(),
    )


def encrypt_token(token: str, key: str) -> str:
    try:
        from cryptography.fernet import Fernet

        return Fernet(key.encode("utf-8")).encrypt(token.encode("utf-8")).decode("utf-8")
    except (ImportError, ValueError) as exc:
        raise InstagramIntegrationError(
            status_code=500,
            code="token_encryption_unavailable",
            message="Secure token storage is unavailable.",
        ) from exc


async def complete_instagram_connection(
    *,
    database: Database,
    settings: InstagramSettings,
    code: str,
    state: str,
    client: httpx.AsyncClient | None = None,
) -> InstagramAccountSummary:
    if settings.missing():
        raise configuration_error(settings)
    now = utc_now()
    if not database.consume_oauth_state(state, now.isoformat()):
        raise InstagramIntegrationError(
            status_code=400,
            code="invalid_oauth_state",
            message="The Instagram authorization state is invalid or expired.",
        )

    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=15)
    try:
        token_response = await http_client.post(
            "https://api.instagram.com/oauth/access_token",
            data={
                "client_id": settings.app_id,
                "client_secret": settings.app_secret,
                "grant_type": "authorization_code",
                "redirect_uri": settings.redirect_uri,
                "code": code,
            },
        )
        token_response.raise_for_status()
        token_payload = token_response.json()
        access_token = token_payload.get("access_token")
        if not access_token:
            raise ValueError("Missing access token")

        long_token_response = await http_client.get(
            "https://graph.instagram.com/access_token",
            params={
                "grant_type": "ig_exchange_token",
                "client_secret": settings.app_secret,
                "access_token": access_token,
            },
        )
        long_token_response.raise_for_status()
        long_token_payload = long_token_response.json()
        access_token = long_token_payload.get("access_token")
        expires_in = int(long_token_payload.get("expires_in") or 0)
        if not access_token:
            raise ValueError("Missing long-lived access token")

        profile_response = await http_client.get(
            f"https://graph.instagram.com/{settings.api_version}/me",
            params={
                "fields": "user_id,username,account_type",
                "access_token": access_token,
            },
        )
        profile_response.raise_for_status()
        profile: dict[str, Any] = profile_response.json()
        instagram_user_id = str(profile.get("user_id") or profile.get("id") or "")
        username = str(profile.get("username") or "")
        if not instagram_user_id or not username:
            raise ValueError("Incomplete Instagram profile")
    except (httpx.HTTPError, ValueError) as exc:
        raise InstagramIntegrationError(
            status_code=502,
            code="instagram_oauth_failed",
            message="Instagram authorization could not be completed.",
            retryable=True,
        ) from exc
    finally:
        if owns_client:
            await http_client.aclose()

    return database.upsert_instagram_account(
        instagram_user_id=instagram_user_id,
        username=username,
        account_type=profile.get("account_type"),
        token_ciphertext=encrypt_token(access_token, settings.token_encryption_key or ""),
        scopes=REQUIRED_SCOPES,
        now_iso=now.isoformat(),
        token_expires_at=(now + timedelta(seconds=expires_in)).isoformat() if expires_in else None,
    )
