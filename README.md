# Creator Growth Copilot — Full Stack

This repository contains the current verified Creator Growth Copilot frontend
and deterministic M0 backend:

- `frontend/`: Next.js and TypeScript
- `backend/`: Python, FastAPI, and Pydantic
- API integration: `POST /api/v1/analyses`
- Health check: `GET /health`
- Interactive API documentation: `http://127.0.0.1:8000/docs`

Playwright end-to-end and integration checks are included in the frontend.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Python 3.11 or newer

## 1. Start the Python backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Check the API:

```bash
curl http://127.0.0.1:8000/health
```

## 2. Start the Next.js frontend

Open a second terminal:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open `http://127.0.0.1:3000`.

The included frontend environment uses:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCK=false
```

## Verification

Backend:

```bash
cd backend
source .venv/bin/activate
pytest
```

Frontend:

```bash
cd frontend
npm run typecheck
NEXT_PUBLIC_USE_MOCK=true npm run build
npm run test:e2e
npx playwright test -c playwright.integration.config.ts
```

## Current API scope

The API validates input, returns stable error contracts, attaches request IDs,
and produces a deterministic seven-day analysis plan. The current M0 scope does
not include a database, social login, social-platform scraping, automatic
posting, or a live AI provider.
