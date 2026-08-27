# Creator Growth Copilot backend

Deterministic FastAPI/Pydantic implementation of the CGC M0 contract.

## Scope

- `GET /health`
- `POST /api/v1/analyses`
- stable `400`, `422`, and `500` error envelopes
- exactly seven deterministic plan items
- localhost CORS for the Next.js frontend
- no database, social login, scraping, posting, paid service, API key, or live AI provider

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

API docs: `http://127.0.0.1:8000/docs`

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
