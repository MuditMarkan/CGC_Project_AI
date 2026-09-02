# CGC Connected Account integration

## Implemented

- One public TypeScript/Pydantic analysis contract.
- Manual Insights values are stored in frontend state and sent to FastAPI.
- Goal labels map exactly to the backend goal and primary-metric enums.
- Creator/workspace name and target audience are editable rather than hidden defaults.
- Analysis runs persist in SQLite for the development slice.
- Instagram Login authorization uses a one-time, ten-minute OAuth state.
- OAuth tokens are encrypted before persistence; plaintext tokens are not logged or returned.
- Connected account identity can be selected by the frontend and is validated by the backend.
- Local disconnect clears the encrypted token and marks the connection revoked.

## Deliberately blocked

- Live OAuth cannot be verified until Meta developer registration succeeds and an App ID,
  App Secret, redirect URI, supported API version, and token-encryption key are configured.
- Live Instagram Insights retrieval is not represented as complete. Manual Insights remain
  the honest data path until an owned Professional test account passes the live acceptance gate.
- Publishing, comments, messages, ads, scraping, and personal Instagram accounts are excluded.

## Live acceptance gate

1. Configure the five server-side environment values without committing them.
2. Connect one owned Instagram Professional test account.
3. Confirm the callback persists only encrypted token material and account metadata.
4. Confirm the frontend lists and selects the connected account.
5. Submit real manually supplied Insights and verify request, database row, and rendered result.
6. Add the live read-only Insights adapter only after field-by-field Meta permission proof.

Official references:

- Meta Instagram API documentation: https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api
- Meta Insights guide: https://www.postman.com/meta/instagram/folder/23987686-f659d7d1-d74c-44e4-9192-9b1e8694c511
