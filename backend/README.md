# Creator Growth Copilot backend

Persistent FastAPI/Pydantic implementation of the CGC integration contract.

## Scope

- `GET /health`
- `POST /api/v1/analyses`
- `GET /api/v1/instagram/config`
- `POST /api/v1/instagram/connect`
- `GET /api/v1/instagram/callback`
- `GET /api/v1/instagram/accounts`
- `DELETE /api/v1/instagram/accounts/{account_id}`
- stable `400`, `422`, and `500` error envelopes
- exactly seven deterministic plan items
- localhost CORS for the Next.js frontend
- SQLite persistence for analysis runs, OAuth state, and account metadata
- encrypted OAuth token storage when Meta configuration is available
- no scraping, posting, Instagram passwords, paid service, or live AI provider

## Run

```bash
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

API docs: `http://127.0.0.1:8000/docs`

The Meta flow fails closed until all values in `.env.example` are configured.
The only requested permissions are `instagram_business_basic` and
`instagram_business_manage_insights`.

## Test

```bash
source .venv/bin/activate
pytest
```

The frontend must use:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_USE_MOCK=false
```
