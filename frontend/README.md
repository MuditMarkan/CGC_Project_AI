# Creator Growth Copilot frontend

Next.js implementation of the approved CGC black-and-white Product UI v0.1.

## Included

- Six responsive destinations: Dashboard, New Analysis, Audit Results, Growth Plan, Experiment Results, and Export.
- Simple monochrome desktop sidebar and five-item mobile navigation with a `More` menu.
- Accessible analysis form with client-side validation, loading, cancellation, error, and completed states.
- Working clipboard paste, four content-medium options, and a complete form reset.
- Manual Insights values are submitted to FastAPI and returned with calculated per-reach ratios.
- FastAPI-compatible request/response contracts and one API client.
- The latest API response powers the standalone Audit Results and Growth Plan routes for the current browser session.
- Explicit deterministic M0 mode returning exactly seven daily tasks.
- Playwright coverage for desktop Chrome and a 390 × 844 mobile viewport.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

The checked-in `.env.example` uses the real local FastAPI service by default. Start `../backend` on port 8000, then set `NEXT_PUBLIC_USE_MOCK=false`. Use `true` only for an isolated deterministic frontend demo.

## Verification

```bash
npm run typecheck
NEXT_PUBLIC_USE_MOCK=true npm run build
npm run test:e2e
npm run test:integration
```

Keep the backend running for the integration test. Playwright starts the frontend at `http://127.0.0.1:3100`; the API must be available at `http://127.0.0.1:8000`. The API integration lives in `lib/api.ts`; public contracts live in `lib/contracts.ts`. Provider keys and database credentials must never be added to `NEXT_PUBLIC_*` variables.
