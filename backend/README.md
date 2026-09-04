# Creator Growth Copilot backend

FastAPI/Pydantic implementation of the deterministic CGC M0 analysis contract.

## Included

- `GET /health`
- `POST /api/v1/analyses`
- Pydantic request and response validation
- stable `400`, `422`, and `500` error envelopes
- deterministic analysis IDs for identical request bodies
- exactly seven plan items per successful analysis
- validated optional manual Insights
- saves, shares, and profile-visits per-reach calculations
- request IDs through the `X-Request-ID` response header
- configurable localhost CORS for the Next.js frontend and integration tests
- pytest API and frontend/backend contract-alignment coverage

## Requirements

- Python 3.11 or newer

## Run on Windows with PowerShell

From the repository root:

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

If the environment already exists:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

If PowerShell blocks activation, run the environment's Python directly:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

## Run on macOS or Linux

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

## Local addresses

- Health: `http://127.0.0.1:8000/health`
- Swagger UI: `http://127.0.0.1:8000/docs`
- OpenAPI JSON: `http://127.0.0.1:8000/openapi.json`

## Configuration

The optional `CGC_ALLOWED_ORIGINS` environment variable is a comma-separated
list. Its checked-in example allows the local frontend on ports 3000 and 3100:

```dotenv
CGC_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3100,http://127.0.0.1:3100
```

The frontend must use:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_USE_MOCK=false
```

## API contract

`POST /api/v1/analyses` accepts:

- creator/workspace name
- either a public content URL or manual content
- Instagram as the platform
- carousel, single image, reel, or story as the content medium
- target audience, goal, primary metric, and one or more brand tones
- optional non-negative manual values for impressions, reach, saves, shares,
  and profile visits

A successful response includes observed facts, explicit assumptions,
prioritized findings, calculated per-reach metrics, exactly seven daily tasks,
the next experiment, and limitations. The public URL is recorded but is not
retrieved in M0.

## Test

Windows:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pytest
```

macOS/Linux:

```bash
cd backend
source .venv/bin/activate
python -m pytest
```

The contract-alignment test compares the Pydantic request field names with
`frontend/lib/contracts.ts` so backend/frontend drift fails the test suite.

## Current limitations

There is no database, social login, content retrieval, scraping, posting, paid
service, API key, or live AI provider. Responses are deterministic M0 sample
analysis and should not be represented as live Instagram findings.
