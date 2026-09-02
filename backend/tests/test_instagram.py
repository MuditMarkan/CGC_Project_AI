import asyncio

import httpx
from cryptography.fernet import Fernet

from app.database import Database
from app.instagram import (
    REQUIRED_SCOPES,
    InstagramSettings,
    begin_instagram_connection,
    complete_instagram_connection,
)


def settings() -> InstagramSettings:
    return InstagramSettings(
        app_id="test-app-id",
        app_secret="test-secret",
        redirect_uri="http://localhost:8000/api/v1/instagram/callback",
        api_version="v-test",
        token_encryption_key=Fernet.generate_key().decode(),
        frontend_url="http://localhost:3000",
    )


def test_oauth_contract_persists_state_and_connected_account(tmp_path) -> None:
    database = Database(str(tmp_path / "cgc.db"))
    current_settings = settings()
    connection = begin_instagram_connection(database, current_settings)
    assert "instagram_business_basic" in connection.authorization_url
    assert "instagram_business_manage_insights" in connection.authorization_url
    state = connection.authorization_url.split("state=", 1)[1]

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.host == "api.instagram.com":
            return httpx.Response(200, json={"access_token": "short-lived-token", "user_id": 42})
        if request.url.path == "/access_token":
            return httpx.Response(200, json={"access_token": "long-lived-token", "expires_in": 5_184_000})
        return httpx.Response(
            200,
            json={"user_id": "42", "username": "cgc_test_creator", "account_type": "CREATOR"},
        )

    async def complete():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            return await complete_instagram_connection(
                database=database,
                settings=current_settings,
                code="authorization-code",
                state=state,
                client=client,
            )

    account = asyncio.run(complete())
    assert account.username == "cgc_test_creator"
    assert account.scopes == REQUIRED_SCOPES
    assert account.token_expires_at is not None
    assert database.list_instagram_accounts() == [account]
    assert database.disconnect_instagram_account(account.id, account.updated_at) is True
    assert database.list_instagram_accounts() == []
