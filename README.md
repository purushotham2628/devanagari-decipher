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

## What this project does

Sanskrit Decoder provides an end-to-end workflow for converting Sanskrit or Devanagari script (typed or image) into:

- Verified Devanagari/Sanskrit text
- IAST transliteration
- Fluent scholarly English translation
- Word-by-word breakdown
- Contextual cultural and historical notes
- Confidence metadata for each translation

Users can upload inscription images or paste text, view results in a readable scholarly format, and browse saved translation history.

## Architecture & Flow

1. Frontend (`artifacts/sanskrit-translator`) — React + Vite UI
	- Users upload an image or enter Devanagari/Sanskrit text and submit a translation request.
	- Shows progress state, renders `originalText`, `transliteration`, `englishTranslation`, `wordByWord`, and `confidence`.
	- Offers history browsing and download/export (frontend UI for download is planned as an enhancement).

2. API Backend (`services/python-api`) — FastAPI
	- Routes:
	  - `POST /py-api/translate/text` — accepts text payloads
	  - `POST /py-api/translate/image` — accepts multipart image uploads
	  - `GET /py-api/translate/history` — lists saved translations
	- Image processing pipeline: image resizing, denoising/sharpening (OpenCV/PIL fallback)
	- Calls Google Gemini (Generative Language) API with a scholarly system prompt
	- Parses Gemini JSON output, saves a record to SQLite, and returns the structured result to the frontend

3. Storage — SQLite
	- Located at `services/python-api/translations.db`
	- Stores original text, transliteration, English translation, word-by-word breakdown, context, source type, confidence, and timestamp.

4. External service — Google Gemini
	- Used for OCR-like image-to-text decoding, transliteration, and scholarly translation generation.

Flow summary:

Frontend -> Backend (/py-api) -> Image enhancement -> Gemini API -> Parse JSON -> Save to SQLite -> Respond -> Frontend displays result

## Future enhancements

- Add a `qualityScore` field returned by the backend (e.g., model-estimated translation quality) and display it in the UI.
- Add automatic script-type detection (Devanagari, Brahmi, Grantha, etc.) and present `scriptType` with the translation.
- Add a frontend `Download translation` button that exports JSON, TXT, or PDF for a selected result.
- Add OCR fallback using an OCR engine (Tesseract or a specialized OCR model) for low-quality images before or alongside Gemini.
- Add user accounts and per-user history with optional export & import features.
- Improve reliability with retries, rate-limiting, and caching for Gemini requests.
- Add e2e tests and CI/CD pipeline for automated builds and linting.
- Provide an offline mode with local model support or OCR-only translations.

---

If you'd like I can also:

- Add a small architecture diagram to the README (SVG or ASCII art).
- Implement the `qualityScore`, `scriptType`, and `download` features in the backend and frontend next — tell me which to implement first.

## Scoring details (confidence and quality)

- **Confidence**: this value is taken from the Gemini model output when the model provides an explicit `confidence` field (a float between 0.0 and 1.0). If Gemini does not provide a confidence value, the backend uses a conservative default of `0.8`. This field represents the model's internal estimate of how certain it is about the translation result.

- **qualityScore**: a derived heuristic (0.0–1.0) computed by the backend to give a quick sense of translation completeness and apparent quality. The algorithm is intentionally conservative and currently uses the following rules:
	- Start from the `confidence` (model-provided or default) and scale it slightly (weighted base).
	- Add small bonuses when helpful artifacts are present:
		- `wordByWord` present: +0.05
		- `context` present: +0.03
		- non-empty `transliteration` of reasonable length: +0.02
		- substantive English translation (length heuristic): +0.02
	- The computed score is clamped to the [0.0, 1.0] range and rounded to three decimal places.

The `qualityScore` is intended to be a lightweight, explainable indicator of result quality for UI display and filtering; it is not a replacement for human review. Future improvements can replace or augment this heuristic with model-based calibration or external validation checks.

## Architecture Diagram

```mermaid
flowchart LR
	UI[User UI] -->|submit image/text| API[Backend API (/py-api)]
	API -->|enhance image| IMGPROC[Image Enhancement (OpenCV / PIL)]
	IMGPROC -->|send base64| GEMINI[Google Gemini (gemini-2.5-flash)]
	GEMINI -->|JSON response| PARSE[Parse / Validate JSON]
	PARSE -->|save| DB[SQLite (translations.db)]
	PARSE -->|return| API
	API -->|response| UI
	subgraph Frontend
		UI
	end
	subgraph Backend
		API --> IMGPROC
		IMGPROC --> GEMINI
		GEMINI --> PARSE
		PARSE --> DB
	end
```

This diagram shows the high-level runtime flow: user input in the frontend is sent to the FastAPI backend, images are enhanced, the enhanced payload is sent to Google Gemini, the returned JSON is parsed and persisted, then the frontend displays the structured result.

## Machine learning models and tooling used

- Primary LLM: **Google Gemini** (`gemini-2.5-flash`) — used to perform image-to-text decoding (when given an image payload), IAST transliteration, scholarly English translation, word-by-word breakdown, contextual notes, and an estimated `confidence` value. The backend posts structured prompts (see `TRANSLATION_SYSTEM`, `TRANSLATION_PROMPT_IMAGE`, `TRANSLATION_PROMPT_TEXT`) and expects JSON-only responses.
- Image processing: **OpenCV** (`cv2`) for denoising, adaptive threshold, and sharpening when available. A **PIL** fallback (ImageEnhance, ImageFilter) is used when OpenCV is not present.
- Optional OCR fallback (not currently enabled by default): **Tesseract OCR** or a specialized OCR model can be integrated to extract characters from low-quality images before or alongside Gemini calls.
- Local ML / offline options: none included by default — the system relies on Gemini as the model provider. Future work could add on-device or private model adapters (e.g., OpenVINO, ONNX runtime, or community OCR/transliteration models) for offline support and lower latency.

Notes:

- The `confidence` field comes from the parsed Gemini JSON if provided; otherwise the backend uses a conservative default (0.8) or a parse-time fallback.
- Prompt engineering in `services/python-api/main.py` frames the LLM as an expert Sanskrit scholar and instructs it to return strict JSON to simplify parsing.
- Sending images to Gemini uses base64-encoded inline parts; ensure your API quota and model permissions allow image inputs.
- Keep `AI_INTEGRATIONS_GEMINI_API_KEY` secure and do not commit it — `.env` is ignored by default.
