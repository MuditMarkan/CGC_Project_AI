from fastapi.testclient import TestClient
from unittest.mock import patch

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
        "goal": "increase_saves",
        "primary_metric": "saves",
        "brand_tone": ["practical"],
    }


def test_health_contract() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "api": "ready",
        "database": "not_required_for_m0",
        "provider": "mock",
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
    assert first.json()["seven_day_plan"][0]["success_metric"] == "saves"


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
