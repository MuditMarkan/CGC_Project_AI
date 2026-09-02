from __future__ import annotations

import os
import uuid

from fastapi import FastAPI, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from .database import get_database
from .instagram import (
    REQUIRED_SCOPES,
    InstagramIntegrationError,
    InstagramSettings,
    begin_instagram_connection,
    complete_instagram_connection,
    utc_now,
)
from .models import (
    AnalysisRequest,
    AnalysisResponse,
    ErrorBody,
    HealthResponse,
    InstagramAccountsResponse,
    InstagramConfigResponse,
    InstagramConnectResponse,
)
from .service import build_analysis


class InvalidInputError(Exception):
    def __init__(self, message: str, details: dict[str, object] | None = None) -> None:
        self.message = message
        self.details = details or {}
        super().__init__(message)


def error_response(*, status_code: int, code: str, message: str, retryable: bool, details: dict[str, object]) -> JSONResponse:
    body = ErrorBody.model_validate(
        {
            "error": {
                "code": code,
                "message": message,
                "retryable": retryable,
                "details": details,
            }
        }
    )
    return JSONResponse(status_code=status_code, content=body.model_dump(mode="json"))


app = FastAPI(
    title="Creator Growth Copilot API",
    version="0.3.0",
    description="Persistent CGC API with a bounded Instagram Professional-account OAuth seam.",
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CGC_ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-Request-ID"],
    expose_headers=["X-Request-ID"],
)


@app.middleware("http")
async def request_id_header(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


@app.exception_handler(InvalidInputError)
async def invalid_input_handler(_request: Request, exc: InvalidInputError) -> JSONResponse:
    return error_response(
        status_code=400,
        code="invalid_input",
        message=exc.message,
        retryable=False,
        details=exc.details,
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    fields = [".".join(str(part) for part in item["loc"] if part != "body") for item in exc.errors()]
    return error_response(
        status_code=422,
        code="validation_failed",
        message="The request does not match the analysis contract.",
        retryable=False,
        details={"fields": fields},
    )


@app.exception_handler(Exception)
async def internal_error_handler(_request: Request, _exc: Exception) -> JSONResponse:
    return error_response(
        status_code=500,
        code="internal_error",
        message="The analysis could not be completed.",
        retryable=True,
        details={},
    )


@app.exception_handler(InstagramIntegrationError)
async def instagram_error_handler(_request: Request, exc: InstagramIntegrationError) -> JSONResponse:
    return error_response(
        status_code=exc.status_code,
        code=exc.code,
        message=exc.message,
        retryable=exc.retryable,
        details=exc.details,
    )


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    settings = InstagramSettings.from_env()
    get_database()
    return HealthResponse(
        status="ok",
        api="ready",
        database="ready",
        provider="mock",
        instagram="configured" if not settings.missing() else "needs_configuration",
    )


@app.post(
    "/api/v1/analyses",
    response_model=AnalysisResponse,
    responses={400: {"model": ErrorBody}, 422: {"model": ErrorBody}, 500: {"model": ErrorBody}},
)
async def create_analysis(request: AnalysisRequest) -> AnalysisResponse:
    if not request.content_url and not (request.manual_content and request.manual_content.strip()):
        raise InvalidInputError("Provide a public content URL or manual content.")
    database = get_database()
    connected_account = None
    if request.connected_account_id:
        connected_account = database.get_instagram_account(request.connected_account_id)
        if connected_account is None:
            raise InvalidInputError(
                "The selected Instagram account is not connected.",
                {"field": "connected_account_id"},
            )
    response = build_analysis(request, connected_account)
    database.save_analysis(request, response)
    return response


@app.get("/api/v1/instagram/config", response_model=InstagramConfigResponse)
async def instagram_config() -> InstagramConfigResponse:
    settings = InstagramSettings.from_env()
    missing = settings.missing()
    return InstagramConfigResponse(
        configured=not missing,
        provider="instagram_login",
        missing=missing,
        required_scopes=REQUIRED_SCOPES,
        live_verification="blocked" if missing else "available",
    )


@app.post(
    "/api/v1/instagram/connect",
    response_model=InstagramConnectResponse,
    responses={409: {"model": ErrorBody}},
)
async def instagram_connect() -> InstagramConnectResponse:
    return begin_instagram_connection(get_database(), InstagramSettings.from_env())


@app.get("/api/v1/instagram/callback")
async def instagram_callback(
    code: str = Query(min_length=1),
    state: str = Query(min_length=1),
) -> RedirectResponse:
    settings = InstagramSettings.from_env()
    account = await complete_instagram_connection(
        database=get_database(),
        settings=settings,
        code=code,
        state=state,
    )
    separator = "&" if "?" in settings.frontend_url else "?"
    target = f"{settings.frontend_url.rstrip('/')}/analysis{separator}instagram=connected&account_id={account.id}"
    return RedirectResponse(target, status_code=303)


@app.get("/api/v1/instagram/accounts", response_model=InstagramAccountsResponse)
async def instagram_accounts() -> InstagramAccountsResponse:
    return InstagramAccountsResponse(accounts=get_database().list_instagram_accounts())


@app.delete("/api/v1/instagram/accounts/{account_id}", status_code=204)
async def instagram_disconnect(account_id: str) -> None:
    if not get_database().disconnect_instagram_account(account_id, utc_now().isoformat()):
        raise InvalidInputError("The Instagram account is not connected.", {"account_id": account_id})
