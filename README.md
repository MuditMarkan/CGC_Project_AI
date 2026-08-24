# CGC Project AI

## FastAPI setup

Use Python 3.11 or newer. Run these commands from the project root, the folder that contains `README.md`.

### 1. Create a virtual environment

PowerShell (Windows):

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

If PowerShell blocks activation, run this once in PowerShell and then activate again:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. Install the project dependencies

With the virtual environment activated, run:

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

The dependency versions are pinned in `requirements.txt` so the team uses the same FastAPI and Uvicorn versions.

### 3. Start the API

```bash
python -m uvicorn app.main:app --reload
```

The API will be available at <http://127.0.0.1:8000>.

### 4. Verify the installation

Open these URLs in a browser:

- <http://127.0.0.1:8000/> - basic API response
- <http://127.0.0.1:8000/health> - health check
- <http://127.0.0.1:8000/docs> - interactive Swagger API docs

You can also verify the dependency versions with:

```bash
python -m pip show fastapi uvicorn
```

### Daily workflow

From the project root:

```powershell
.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```

Use `source .venv/bin/activate` instead of the first command on macOS/Linux. Press `Ctrl+C` to stop the server, and run `deactivate` when you are finished.