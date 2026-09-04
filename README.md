# Creator Growth Copilot — Full Stack

Creator Growth Copilot (CGC) is a responsive Next.js frontend connected to a
deterministic FastAPI M0 backend. A user can submit an Instagram content brief
and optional manual Insights, review prioritized audit findings, and open the
seven-day growth plan returned by the API.

## Current implementation

- `frontend/`: Next.js 16, React 19, TypeScript, and Playwright
- `backend/`: Python 3.11+, FastAPI, Pydantic, Uvicorn, and pytest
- API integration: `POST /api/v1/analyses`
- Health check: `GET /health`
- API documentation: `http://127.0.0.1:8000/docs`
- Frontend: `http://127.0.0.1:3000`

The backend currently returns deterministic sample analysis. It does not log in
to Instagram, retrieve a supplied URL, use a database, call a live AI provider,
or publish content.

## Requirements

- Git
- Node.js 20 or newer
- npm 10 or newer
- Python 3.11 or newer

## Get the latest code

Run this from the repository root:

```powershell
git pull --ff-only origin master
```

This updates both `frontend/` and `backend/`; it does not start either service.

If Git reports that `.git/index.lock` already exists, first make sure no Git
operation is running. In PowerShell:

```powershell
Get-Process git* -ErrorAction SilentlyContinue
```

If no Git process is listed, remove the stale lock and retry:

```powershell
Remove-Item -LiteralPath ".git\index.lock"
git status
git pull --ff-only origin master
```

## Run on Windows with PowerShell

### 1. Start the backend

From the repository root:

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Leave that terminal running. Confirm the backend is ready at
`http://127.0.0.1:8000/health` or open Swagger UI at
`http://127.0.0.1:8000/docs`.

If `.venv` already exists, the shorter restart sequence is:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Start the frontend

Open a second PowerShell terminal at the repository root:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env.local
npm run dev:fresh
```

Open `http://127.0.0.1:3000`.

## Run on macOS or Linux

### 1. Start the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Start the frontend

Open a second terminal at the repository root:

```bash
cd frontend
npm ci
cp .env.example .env.local
npm run dev:fresh
```

## Environment configuration

Frontend, in `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_USE_MOCK=false
```

Backend, optional override from `backend/.env.example`:

```dotenv
CGC_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3100,http://127.0.0.1:3100
```

Use `127.0.0.1` for the local API address. On some Windows machines,
`localhost` resolves to IPv6 while Uvicorn is listening on IPv4.

Set `NEXT_PUBLIC_USE_MOCK=true` only when intentionally running the frontend
without FastAPI. Never place provider keys or database credentials in a
`NEXT_PUBLIC_*` variable because those values are exposed to the browser.

## Frontend routes

| Route | Screen | Current data source |
| --- | --- | --- |
| `/` | Dashboard | Presentation data |
| `/analysis` | New Diagnostic Audit | Form connected to FastAPI or explicit mock mode |
| `/audit` | Diagnostic Audit Results | Latest API response in browser session storage |
| `/orbit` | Seven-Day Growth Plan | Latest API response in browser session storage |
| `/experiments` | Experiment Diagnostics | Presentation data |
| `/reports` | Export Report | Presentation-only controls |

The `/audit` and `/orbit` pages require a completed analysis in the same browser
tab session. Refreshing the page retains the result; closing the browser session
or clearing session storage removes it.

## API endpoints

### `GET /health`

Returns the service state and makes the M0 dependencies explicit:

```json
{
  "status": "ok",
  "api": "ready",
  "database": "not_required_for_m0",
  "provider": "mock"
}
```

### `POST /api/v1/analyses`

Accepted request fields:

- `creator_name`
- `content_url` or `manual_content` (at least one is required)
- `platform` (`instagram` only)
- `content_medium` (`carousel`, `single_image`, `reel`, or `story`)
- `target_audience`
- `goal`
- `primary_metric`
- `brand_tone`
- optional `manual_insights`: `impressions`, `reach`, `saves`, `shares`, and
  `profile_visits`

The response includes a deterministic analysis ID, submitted and calculated
Insights, observed facts, assumptions, prioritized findings, exactly seven plan
items, the next experiment, and limitations. Unknown request fields fail closed.
Errors use stable `400`, `422`, or `500` envelopes. Every response exposes an
`X-Request-ID` header for troubleshooting.

## Verification

Backend:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pytest
```

Frontend route check, typecheck, build, and mock-mode browser tests:

```powershell
cd frontend
npm run verify:routes
npm run typecheck
$env:NEXT_PUBLIC_USE_MOCK="true"
npm run build
npm run test:e2e
Remove-Item Env:NEXT_PUBLIC_USE_MOCK
```

Full frontend-to-FastAPI integration test, with the backend still running on
port 8000:

```powershell
cd frontend
npm run test:integration
```

Playwright starts its own integration frontend on port 3100. The default backend
CORS configuration allows both ports 3000 and 3100.

## Troubleshooting

### `/analysis`, `/audit`, or `/orbit` returns 404

The route files exist on `master`. Stop the running Next.js process, then run:

```powershell
git pull --ff-only origin master
cd frontend
npm ci
npm run verify:routes
npm run dev:fresh
```

`dev:fresh` verifies all six route files, removes the stale `.next` cache, and
starts Next.js. Frontend pages use port 3000, not the backend's port 8000.

### Frontend reports that it cannot reach the API

- Confirm `http://127.0.0.1:8000/health` returns `status: ok`.
- Confirm `frontend/.env.local` uses `http://127.0.0.1:8000`.
- Restart Next.js after changing `.env.local`.
- Keep the backend and frontend running in separate terminals.

### PowerShell blocks virtual-environment activation

Use the virtual environment's Python directly without changing the system
execution policy:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

## Current limitations

- The backend is deterministic M0 sample analysis, not live Instagram analysis.
- A public URL is recorded but is not fetched.
- Manual Insights are validated and used only for per-reach calculations.
- There is no database or durable analysis history.
- Experiment and export screens are presentation-only.
- There is no social login, scraping, automatic posting, or live AI provider.

See `frontend/README.md` and `backend/README.md` for app-specific details.
