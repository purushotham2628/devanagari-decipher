# Sanskrit Decoder

Sanskrit Decoder is a full-stack Sanskrit translation project. It lets users translate typed Sanskrit or Devanagari text, upload manuscript and inscription images, view scholarly translation details, and browse translation history.

## Technology

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Radix UI, Lucide React, Framer Motion, Wouter, TanStack React Query
- **Python API:** FastAPI, Uvicorn, Aiosqlite, Pillow, NumPy, OpenCV headless, HTTPX
- **AI integration:** Google Gemini API for Sanskrit and image-based translation
- **Database:** SQLite (`services/python-api/translations.db`)
- **Workspace tooling:** pnpm workspaces for JavaScript/TypeScript packages, Python `.venv` for backend dependencies

## Project Structure

- `artifacts/sanskrit-translator` - React/Vite frontend application
- `services/python-api` - FastAPI backend API used by the frontend
- `lib/api-client-react` - shared React API client library
- `lib/api-zod` - shared Zod schema and API types
- `lib/api-spec` - OpenAPI schema and generation config
- `lib/db` - shared database/schema helpers
- `artifacts/api-server` - alternative Express API workspace package
- `scripts` - workspace utility scripts

## Requirements

- Node.js 22+
- pnpm (via Corepack if not installed globally)
- Python 3.12+
- Google Gemini API key

## Optional tools

- `corepack` for pnpm management
- `python-dotenv` for `.env` support

## Backend details

The backend lives in `services/python-api` and provides the following:

- `GET /py-api/healthz` - health check
- `POST /py-api/translate/text` - translate typed Sanskrit text
- `POST /py-api/translate/image` - translate an uploaded image file
- `GET /py-api/translate/history` - list recent translations
- `GET /py-api/translate/history/{id}` - fetch a saved translation record

The backend uses SQLite at:

- `services/python-api/translations.db`

The database stores translation records with fields such as:

- `original_text`
- `transliteration`
- `english_translation`
- `word_by_word`
- `context`
- `source_type`
- `confidence`
- `created_at`

## Frontend details

The frontend lives in `artifacts/sanskrit-translator`.

It renders:

- upload form for images and Sanskrit text
- translation result details
- confidence score and history
- download/export options for translated results

The frontend expects the backend API at `http://127.0.0.1:8000` by default. Requests are proxied through `/py-api`.

## Setup

1. Open a terminal in the repository root.
2. Install JavaScript dependencies:

```powershell
pnpm install
```

3. Create and activate the Python virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

4. Install backend dependencies:

```powershell
python -m pip install -e .
```

5. Create a `.env` file in the repository root with your Gemini credentials:

```text
AI_INTEGRATIONS_GEMINI_API_KEY=your-api-key
AI_INTEGRATIONS_GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```

> Note: If you use a custom Gemini base URL, set `AI_INTEGRATIONS_GEMINI_BASE_URL`.

## Run the project step-by-step

### 1. Start the backend

In terminal 1:

```powershell
cd .\services\python-api
..\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Or from repository root:

```powershell
.\.venv\Scripts\python.exe -m uvicorn services.python-api.main:app --reload --host 127.0.0.1 --port 8000
```

The backend should be available at:

```text
http://127.0.0.1:8000
```

### 2. Start the frontend

In terminal 2:

```powershell
cd .\artifacts\sanskrit-translator
corepack pnpm exec vite --host 0.0.0.0 --port 5173
```

If port `5173` is in use, choose another port:

```powershell
corepack pnpm exec vite --host 0.0.0.0 --port 5174
```

Open the app in your browser at:

```text
http://localhost:5173
```

### 3. Verify the backend from the frontend

The frontend sends requests to the backend proxy path `/py-api`.

If you change the backend host or port, set:

```powershell
$env:PY_API_URL="http://127.0.0.1:8000"
```

## Common commands

```powershell
pnpm run typecheck
pnpm run build
pnpm --filter @workspace/sanskrit-translator dev
python services\python-api\main.py
```

## Troubleshooting

- `403` or `PERMISSION_DENIED` from Gemini: verify `AI_INTEGRATIONS_GEMINI_API_KEY` is set correctly.
- Frontend not loading: check Vite port and `PY_API_URL` configuration.
- Backend not starting: ensure `.venv` is activated and dependencies are installed.

## Notes

- The app saves translations to SQLite at `services/python-api/translations.db`.
- The backend automatically initializes the database schema on startup.
- The frontend currently uses the Gemini translation API to generate Sanskrit transliteration, translation, and quality/confidence metadata.
