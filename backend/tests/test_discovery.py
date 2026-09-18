import httpx
import pytest
from fastapi.testclient import TestClient

from app.discovery import MetaDiscoverySettings, discover_public_profile, normalize_instagram_target
from app.main import app


client = TestClient(app, raise_server_exceptions=False)


def test_target_normalization_accepts_username_and_profile_url() -> None:
    assert normalize_instagram_target("@Kate.Creator") == "kate.creator"
    assert normalize_instagram_target("https://www.instagram.com/Kate.Creator/") == "kate.creator"


@pytest.mark.parametrize(
    "target",
    [
        "https://example.com/kate",
        "https://www.instagram.com/p/ABC123/",
        "https://www.instagram.com/reel/ABC123/",
        "not a username",
    ],
)
def test_target_normalization_rejects_unsupported_targets(target: str) -> None:
    with pytest.raises(Exception):
        normalize_instagram_target(target)


def test_endpoint_fails_closed_without_server_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("CGC_META_IG_USER_ID", raising=False)
    monkeypatch.delenv("CGC_META_PAGE_ACCESS_TOKEN", raising=False)
    response = client.post("/api/v1/discovery/instagram/profile", json={"target": "kate.creator"})
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "meta_discovery_not_configured"
    assert response.json()["error"]["details"]["missing"] == [
        "CGC_META_IG_USER_ID",
        "CGC_META_PAGE_ACCESS_TOKEN",
    ]


@pytest.mark.asyncio
async def test_business_discovery_normalizes_meta_response() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.host == "graph.facebook.com"
        assert request.url.path == "/v24.0/owned-account-id"
        assert "business_discovery.username(kate.creator)" in request.url.params["fields"]
        assert request.url.params["access_token"] == "server-only-token"
        return httpx.Response(
            200,
            json={
                "business_discovery": {
                    "username": "kate.creator",
                    "name": "Kate Creator",
                    "biography": "Public creator profile",
                    "followers_count": 1234,
                    "follows_count": 98,
                    "media_count": 42,
                    "media": {
                        "data": [
                            {
                                "id": "media-1",
                                "caption": "Example",
                                "media_type": "IMAGE",
                                "permalink": "https://www.instagram.com/p/example/",
                                "timestamp": "2026-09-15T12:00:00+0000",
                                "like_count": 50,
                                "comments_count": 4,
                            }
                        ]
                    },
                }
            },
            request=request,
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as mock_client:
        result = await discover_public_profile(
            "https://instagram.com/kate.creator/",
            settings=MetaDiscoverySettings(
                ig_user_id="owned-account-id",
                page_access_token="server-only-token",
                api_version="v24.0",
            ),
            client=mock_client,
        )

    assert result.provider == "meta_business_discovery"
    assert result.sample_data is False
    assert result.profile.followers_count == 1234
    assert result.profile.media[0].like_count == 50
    assert "profile_picture_url" in result.unavailable_fields


@pytest.mark.asyncio
async def test_business_discovery_maps_meta_permission_error_without_leaking_token() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(400, json={"error": {"message": "permission denied"}}, request=request)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as mock_client:
        with pytest.raises(Exception) as error:
            await discover_public_profile(
                "kate.creator",
                settings=MetaDiscoverySettings("owned", "secret-token", "v24.0"),
                client=mock_client,
            )
    assert "secret-token" not in str(error.value)
