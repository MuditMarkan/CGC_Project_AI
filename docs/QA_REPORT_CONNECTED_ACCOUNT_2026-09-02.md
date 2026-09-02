# CGC Connected Account QA report — 2026-09-02

## Release gate

**GO with caveats** for code review and merge. **NO-GO** for claiming live Instagram
Insights until Meta developer registration and one owned Professional-account OAuth
run pass.

## Automated evidence

- Backend on Python 3.11: `14 passed`.
- Frontend TypeScript: passed.
- Next.js production build: passed; all seven routes generated.
- Local FastAPI/Next.js smoke: passed.
- `POST /api/v1/analyses` accepted manual `reach=10000`, `saves=240`, and
  `shares=90`; response calculated `2.40%` saves/reach and `0.90%` shares/reach.
- SQLite evidence: one analysis row persisted after the smoke request.
- OAuth unit flow: authorization state, token exchange, long-lived token exchange,
  encrypted persistence, account listing, and local disconnect passed with a mocked
  Meta transport. No live credentials were used.

## Visual evidence

- `docs/qa-evidence/connected-account-desktop.png`
- `docs/qa-evidence/connected-account-mobile.png`

Both layouts show the Connected Account surface, editable workspace/audience fields,
manual Insights inputs, correct four goal labels, and an explicit Meta-configuration
blocker. The Connect button is disabled while server configuration is incomplete.

## Residual risks

- Meta App ID/secret, redirect configuration, approved API version, and a real
  Professional test account are not yet available.
- Live Insights retrieval is not implemented or represented as complete.
- Local disconnect clears stored token material; provider-side revocation/refresh
  lifecycle remains a follow-up gate.
- The deterministic analysis provider is still `mock`; this branch repairs the
  integration seam and persistence but does not add the final AI analytics engine.
