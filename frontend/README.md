# Creator Growth Copilot frontend

Responsive Next.js implementation of the CGC black-and-white Product UI v0.1.

## Included

- six App Router destinations for dashboard, analysis, audit, plan, experiment,
  and export views
- responsive desktop navigation and a mobile `More` menu
- accessible analysis form with client-side validation
- clipboard paste, loading, cancellation, reset, error, and completed states
- four content-medium options
- optional manual Instagram Insights input
- typed FastAPI-compatible request and response contracts
- real FastAPI mode and an explicit isolated mock mode
- latest analysis stored for the current browser session
- API-driven audit results and seven-day growth plan
- Playwright coverage for desktop Chrome and a 390 x 844 mobile viewport

## Routes

- `/` — Dashboard
- `/analysis` — New Diagnostic Audit
- `/audit` — latest API audit result
- `/orbit` — latest API seven-day growth plan
- `/experiments` — Experiment Diagnostics presentation
- `/reports` — Export Report presentation

Run an analysis before opening `/audit` or `/orbit`. The latest result is stored
in browser session storage, not in a database. The experiment and export screens
currently contain presentation-only controls and sample content.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- the backend on `http://127.0.0.1:8000` for real integration mode

## Run on Windows with PowerShell

From the repository root, with the backend running in another terminal:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env.local
npm run dev:fresh
```

Open `http://127.0.0.1:3000`.

## Run on macOS or Linux

```bash
cd frontend
npm ci
cp .env.example .env.local
npm run dev:fresh
```

## Environment

The checked-in `.env.example` uses the real local FastAPI service:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_USE_MOCK=false
```

Use `NEXT_PUBLIC_USE_MOCK=true` only for an isolated deterministic frontend
demo. Restart the development server after changing `.env.local`.

Do not add API keys, provider secrets, or database credentials to
`NEXT_PUBLIC_*` variables; Next.js exposes them to the browser.

## Scripts

- `npm run dev` — verify route files and start Next.js
- `npm run dev:fresh` — verify routes, remove `.next`, and start Next.js
- `npm run verify:routes` — confirm all six route files exist
- `npm run typecheck` — run TypeScript without emitting files
- `npm run build` — create the production build
- `npm run start` — serve a completed production build
- `npm run test:e2e` — run desktop and mobile tests in mock mode
- `npm run test:integration` — run the real frontend-to-FastAPI test on port 3100

## Verification

```powershell
npm run verify:routes
npm run typecheck
$env:NEXT_PUBLIC_USE_MOCK="true"
npm run build
npm run test:e2e
Remove-Item Env:NEXT_PUBLIC_USE_MOCK
```

For the real integration test, keep FastAPI running on port 8000 and run:

```powershell
npm run test:integration
```

Playwright starts the integration frontend at `http://127.0.0.1:3100`. The API
integration is in `lib/api.ts`, the shared public TypeScript contract is in
`lib/contracts.ts`, and session persistence is in `lib/analysis-session.ts`.

## Troubleshooting

If `/analysis`, `/audit`, or `/orbit` returns 404, stop Next.js and run:

```powershell
git pull --ff-only origin master
cd frontend
npm ci
npm run verify:routes
npm run dev:fresh
```

If the API request fails, confirm that `http://127.0.0.1:8000/health` works and
that `.env.local` uses `127.0.0.1`, then restart Next.js.
