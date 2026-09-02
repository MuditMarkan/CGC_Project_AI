import os
import tempfile
from fastapi.testclient import TestClient
from unittest.mock import patch

os.environ["CGC_DATABASE_PATH"] = os.path.join(tempfile.mkdtemp(prefix="cgc-tests-"), "cgc.db")

from app.main import app


client = TestClient(app, raise_server_exceptions=False)


def valid_payload() -> dict[str, object]:
    return {
        "creator_name": "Narrative Co.",
        "content_url": None,
        "manual_content": "A practical guide to AI for a small service business.",
        "platform": "instagram",
        "content_medium": "carousel",
        "target_audience": "Instagram nano-business audience",
        "goal": "increase_saves_per_reach",
        "primary_metric": "saves_per_reach",
        "brand_tone": ["practical"],
        "manual_metrics": None,
        "connected_account_id": None,
    }


def test_health_contract() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "api": "ready",
        "database": "ready",
        "provider": "mock",
        "instagram": "needs_configuration",
    }
    assert response.headers["X-Request-ID"]


def test_valid_analysis_is_deterministic_and_has_seven_days() -> None:
    first = client.post("/api/v1/analyses", json=valid_payload(), headers={"X-Request-ID": "qa-request"})
    second = client.post("/api/v1/analyses", json=valid_payload())
    assert first.status_code == 200
    assert first.headers["X-Request-ID"] == "qa-request"
    assert first.json()["analysis_id"] == second.json()["analysis_id"]
    assert first.json()["sample_data"] is True
    assert first.json()["provider"] == "mock"
    assert len(first.json()["seven_day_plan"]) == 7
    assert first.json()["seven_day_plan"][0]["success_metric"] == "saves_per_reach"


def test_manual_metrics_reach_backend_and_provenance() -> None:
    payload = valid_payload()
    payload["manual_metrics"] = {"reach": 10_000, "saves": 240, "shares": 90}
    response = client.post("/api/v1/analyses", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert "manual_metrics" in body["data_provenance"]
    assert "Saves per reach: 2.40%." in body["observed_facts"]
    assert "Shares per reach: 0.90%." in body["observed_facts"]


def test_goal_and_primary_metric_must_match() -> None:
    payload = valid_payload()
    payload["primary_metric"] = "reach"
    response = client.post("/api/v1/analyses", json=payload)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_failed"


def test_missing_content_returns_stable_400_contract() -> None:
    payload = valid_payload()
    payload["manual_content"] = None
    response = client.post("/api/v1/analyses", json=payload)
    assert response.status_code == 400
    assert response.json() == {
        "error": {
            "code": "invalid_input",
            "message": "Provide a public content URL or manual content.",
            "retryable": False,
            "details": {},
        }
    }


def test_invalid_platform_returns_stable_422_contract() -> None:
    payload = valid_payload()
    payload["platform"] = "tiktok"
    response = client.post("/api/v1/analyses", json=payload)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_failed"
    assert "platform" in response.json()["error"]["details"]["fields"]


def test_unknown_fields_fail_closed() -> None:
    payload = valid_payload()
    payload["instagram_password"] = "must-not-be-accepted"
    response = client.post("/api/v1/analyses", json=payload)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_failed"


def test_cors_allows_local_frontend() -> None:
    response = client.options(
        "/api/v1/analyses",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_instagram_config_is_honest_when_meta_is_missing() -> None:
    response = client.get("/api/v1/instagram/config")
    assert response.status_code == 200
    assert response.json()["configured"] is False
    assert response.json()["live_verification"] == "blocked"
    assert "CGC_INSTAGRAM_APP_ID" in response.json()["missing"]


def test_instagram_connect_fails_closed_when_unconfigured() -> None:
    response = client.post("/api/v1/instagram/connect")
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "instagram_not_configured"


def test_instagram_accounts_start_empty() -> None:
    response = client.get("/api/v1/instagram/accounts")
    assert response.status_code == 200
    assert response.json() == {"accounts": []}


def test_internal_failure_returns_stable_500_contract() -> None:
    with patch("app.main.build_analysis", side_effect=RuntimeError("hidden implementation detail")):
        response = client.post("/api/v1/analyses", json=valid_payload())
    assert response.status_code == 500
    assert response.json() == {
        "error": {
            "code": "internal_error",
            "message": "The analysis could not be completed.",
            "retryable": True,
            "details": {},
        }
    }
