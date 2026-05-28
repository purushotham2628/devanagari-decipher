---
name: Replit Gemini proxy path format
description: The correct URL path format for the Replit AI Integrations Gemini proxy when making direct HTTP calls
---

# Replit Gemini Proxy — Correct Path Format

## Rule
When calling the Replit Gemini proxy via direct HTTP (httpx/requests/fetch), omit the API version prefix entirely.

**Correct:**
`{AI_INTEGRATIONS_GEMINI_BASE_URL}/models/{model}:generateContent`

**Wrong (returns 400 INVALID_ENDPOINT):**
- `{BASE_URL}/v1beta/models/{model}:generateContent`
- `{BASE_URL}/v1/models/{model}:generateContent`

**Why:** The Replit modelfarm proxy (`http://localhost:1106/modelfarm/gemini`) expects paths without a version segment. The standard Gemini SDK appends `/v1beta/` automatically, which the proxy rejects. Raw HTTP calls must strip the version.

**How to apply:** In Python FastAPI services using httpx to call Gemini, build the URL as:
```python
f"{GEMINI_BASE_URL}/models/{GEMINI_MODEL}:generateContent"
```
If using the `google-genai` Python SDK, this path issue means the SDK won't work with the Replit proxy unless `api_version` can be set to empty string — use direct httpx instead.
