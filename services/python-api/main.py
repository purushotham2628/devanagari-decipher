import asyncio
import base64
import json
import logging
import os
import re
from contextlib import asynccontextmanager
from datetime import datetime
from io import BytesIO
from typing import Optional

import aiosqlite
import httpx
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageEnhance, ImageFilter
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(__file__), "translations.db")


# ─── Database ────────────────────────────────────────────────────────────────

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS translations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                original_text TEXT NOT NULL,
                transliteration TEXT NOT NULL,
                english_translation TEXT NOT NULL,
                word_by_word TEXT,
                context TEXT,
                source_type TEXT NOT NULL DEFAULT 'text',
                confidence REAL DEFAULT 0.8,
                created_at TEXT NOT NULL
            )
        """)
        await db.commit()


async def save_translation(
    original_text: str,
    transliteration: str,
    english_translation: str,
    word_by_word: Optional[str],
    context: Optional[str],
    source_type: str,
    confidence: float,
) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """INSERT INTO translations
               (original_text, transliteration, english_translation,
                word_by_word, context, source_type, confidence, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                original_text,
                transliteration,
                english_translation,
                word_by_word,
                context,
                source_type,
                confidence,
                datetime.utcnow().isoformat() + "Z",
            ),
        )
        await db.commit()
        return cursor.lastrowid


# ─── Lifespan ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    logger.info("Database initialised")
    yield


# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(title="Sanskrit Translator API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Image pre-processing ────────────────────────────────────────────────────

def enhance_image(image_bytes: bytes) -> tuple[bytes, str]:
    """Enhance an inscription image and return enhanced bytes + mime type."""
    try:
        img = Image.open(BytesIO(image_bytes)).convert("RGB")

        # Resize if too small
        w, h = img.size
        if max(w, h) < 800:
            scale = 800 / max(w, h)
            img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

        # Convert to numpy for OpenCV-style processing
        try:
            import cv2

            arr = np.array(img)
            gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
            # Denoise
            denoised = cv2.fastNlMeansDenoising(gray, h=10)
            # Adaptive threshold to bring out script
            thresh = cv2.adaptiveThreshold(
                denoised, 255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY, 11, 2,
            )
            # Sharpen
            kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
            sharpened = cv2.filter2D(thresh, -1, kernel)
            enhanced_pil = Image.fromarray(sharpened).convert("RGB")
        except Exception:
            # Fallback: PIL-only enhancement
            enhanced_pil = img
            enhanced_pil = ImageEnhance.Contrast(enhanced_pil).enhance(1.8)
            enhanced_pil = ImageEnhance.Sharpness(enhanced_pil).enhance(2.0)
            enhanced_pil = enhanced_pil.filter(ImageFilter.SHARPEN)

        buf = BytesIO()
        enhanced_pil.save(buf, format="JPEG", quality=95)
        return buf.getvalue(), "image/jpeg"
    except Exception as exc:
        logger.warning("Image enhancement failed, using original: %s", exc)
        return image_bytes, "image/jpeg"


# ─── Gemini client ───────────────────────────────────────────────────────────

GEMINI_BASE_URL = os.environ.get("AI_INTEGRATIONS_GEMINI_BASE_URL", "").rstrip("/")
GEMINI_API_KEY = os.environ.get("AI_INTEGRATIONS_GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-2.5-flash"


def _gemini_url() -> str:
    """Build the correct generateContent URL for the Replit proxy (no version prefix)."""
    if GEMINI_BASE_URL:
        return f"{GEMINI_BASE_URL}/models/{GEMINI_MODEL}:generateContent"
    return f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"


def _gemini_headers() -> dict:
    return {"Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY}


TRANSLATION_SYSTEM = (
    "You are an expert Sanskrit and ancient Devanagari script scholar with deep "
    "knowledge of classical Sanskrit, Vedic texts, Puranas, inscriptions, and ancient "
    "Indian literature. You specialize in decoding ancient manuscripts, temple "
    "inscriptions, copper plates, stone carvings, and palm-leaf texts.\n\n"
    "Respond ONLY with valid JSON — no markdown, no code fences, no extra text."
)

TRANSLATION_PROMPT_IMAGE = """Analyze this image of an ancient inscription, manuscript, or carved text.

1. Extract ALL visible Devanagari/Sanskrit text — even if faded, damaged, or partially broken
2. Provide accurate IAST (International Alphabet of Sanskrit Transliteration)
3. Translate to fluent, scholarly English
4. Give word-by-word breakdown where meaningful
5. Provide cultural, historical, or religious context
6. Estimate your confidence (0.0–1.0)

Respond ONLY with this JSON:
{
  "originalText": "full Devanagari/Sanskrit text",
  "transliteration": "IAST transliteration",
  "englishTranslation": "accurate English translation",
  "wordByWord": "word1: meaning; word2: meaning; ...",
  "context": "cultural/historical/religious context notes",
  "confidence": 0.85
}

If no Devanagari/Sanskrit text is visible, still return JSON with originalText="[No Sanskrit text detected]" and explain in context."""

TRANSLATION_PROMPT_TEXT = """Translate this Devanagari/Sanskrit text into English.

Text: {text}

Provide:
1. Verify/correct the Devanagari input
2. Accurate IAST transliteration
3. Fluent scholarly English translation
4. Word-by-word breakdown
5. Cultural/historical/religious context
6. Confidence score (0.0–1.0)

Respond ONLY with this JSON:
{{
  "originalText": "{text}",
  "transliteration": "IAST transliteration",
  "englishTranslation": "accurate English translation",
  "wordByWord": "word1: meaning; word2: meaning; ...",
  "context": "cultural/historical/religious context",
  "confidence": 0.95
}}"""


async def call_gemini_image(image_bytes: bytes, mime_type: str) -> dict:
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    payload = {
        "system_instruction": {"parts": [{"text": TRANSLATION_SYSTEM}]},
        "contents": [{
            "role": "user",
            "parts": [
                {"inline_data": {"mime_type": mime_type, "data": image_b64}},
                {"text": TRANSLATION_PROMPT_IMAGE},
            ],
        }],
        "generationConfig": {"maxOutputTokens": 8192, "temperature": 0.1},
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(_gemini_url(), json=payload, headers=_gemini_headers())
        resp.raise_for_status()
    raw_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    return _parse_gemini_json(raw_text)


async def call_gemini_text(text: str) -> dict:
    prompt = TRANSLATION_PROMPT_TEXT.format(text=text)
    payload = {
        "system_instruction": {"parts": [{"text": TRANSLATION_SYSTEM}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": 8192, "temperature": 0.1},
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(_gemini_url(), json=payload, headers=_gemini_headers())
        resp.raise_for_status()
    raw_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    return _parse_gemini_json(raw_text)


def _parse_gemini_json(raw: str) -> dict:
    """Strip markdown fences if present and parse JSON."""
    cleaned = raw.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    cleaned = cleaned.strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Try extracting first JSON object
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            return json.loads(match.group())
        return {
            "originalText": "[Parse error]",
            "transliteration": "",
            "englishTranslation": raw,
            "wordByWord": None,
            "context": None,
            "confidence": 0.5,
        }


# ─── Schemas ─────────────────────────────────────────────────────────────────

class TextInput(BaseModel):
    text: str


class TranslationOut(BaseModel):
    id: int
    originalText: str
    transliteration: str
    englishTranslation: str
    wordByWord: Optional[str] = None
    context: Optional[str] = None
    sourceType: str
    confidence: float
    createdAt: str


class StatsOut(BaseModel):
    totalTranslations: int
    textTranslations: int
    imageTranslations: int
    todayCount: int


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/py-api/healthz")
async def healthz():
    return {"status": "ok"}


@app.post("/py-api/translate/text", response_model=TranslationOut)
async def translate_text(body: TextInput):
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="text must not be empty")

    try:
        result = await call_gemini_text(body.text)
    except httpx.HTTPStatusError as exc:
        logger.error("Gemini error: %s", exc.response.text)
        raise HTTPException(status_code=502, detail="Translation service error")

    record_id = await save_translation(
        original_text=result.get("originalText", body.text),
        transliteration=result.get("transliteration", ""),
        english_translation=result.get("englishTranslation", ""),
        word_by_word=result.get("wordByWord"),
        context=result.get("context"),
        source_type="text",
        confidence=float(result.get("confidence", 0.8)),
    )
    return TranslationOut(
        id=record_id,
        originalText=result.get("originalText", body.text),
        transliteration=result.get("transliteration", ""),
        englishTranslation=result.get("englishTranslation", ""),
        wordByWord=result.get("wordByWord"),
        context=result.get("context"),
        sourceType="text",
        confidence=float(result.get("confidence", 0.8)),
        createdAt=datetime.utcnow().isoformat() + "Z",
    )


@app.post("/py-api/translate/image", response_model=TranslationOut)
async def translate_image(file: UploadFile = File(...)):
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await file.read()
    if len(image_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 20 MB")

    enhanced_bytes, mime_type = enhance_image(image_bytes)

    try:
        result = await call_gemini_image(enhanced_bytes, mime_type)
    except httpx.HTTPStatusError as exc:
        logger.error("Gemini error: %s", exc.response.text)
        raise HTTPException(status_code=502, detail="Translation service error")

    record_id = await save_translation(
        original_text=result.get("originalText", ""),
        transliteration=result.get("transliteration", ""),
        english_translation=result.get("englishTranslation", ""),
        word_by_word=result.get("wordByWord"),
        context=result.get("context"),
        source_type="image",
        confidence=float(result.get("confidence", 0.8)),
    )
    return TranslationOut(
        id=record_id,
        originalText=result.get("originalText", ""),
        transliteration=result.get("transliteration", ""),
        englishTranslation=result.get("englishTranslation", ""),
        wordByWord=result.get("wordByWord"),
        context=result.get("context"),
        sourceType="image",
        confidence=float(result.get("confidence", 0.8)),
        createdAt=datetime.utcnow().isoformat() + "Z",
    )


@app.get("/py-api/translate/history")
async def get_history(limit: int = 20):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM translations ORDER BY id DESC LIMIT ?", (limit,)
        )
        rows = await cursor.fetchall()
    return [
        {
            "id": r["id"],
            "originalText": r["original_text"],
            "transliteration": r["transliteration"],
            "englishTranslation": r["english_translation"],
            "wordByWord": r["word_by_word"],
            "context": r["context"],
            "sourceType": r["source_type"],
            "confidence": r["confidence"],
            "createdAt": r["created_at"],
        }
        for r in rows
    ]


@app.get("/py-api/translate/history/{translation_id}")
async def get_translation(translation_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM translations WHERE id = ?", (translation_id,)
        )
        row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Translation not found")
    return {
        "id": row["id"],
        "originalText": row["original_text"],
        "transliteration": row["transliteration"],
        "englishTranslation": row["english_translation"],
        "wordByWord": row["word_by_word"],
        "context": row["context"],
        "sourceType": row["source_type"],
        "confidence": row["confidence"],
        "createdAt": row["created_at"],
    }


@app.get("/py-api/translate/stats", response_model=StatsOut)
async def get_stats():
    today = datetime.utcnow().date().isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        total = (await (await db.execute("SELECT COUNT(*) FROM translations")).fetchone())[0]
        text_count = (await (await db.execute(
            "SELECT COUNT(*) FROM translations WHERE source_type='text'"
        )).fetchone())[0]
        image_count = (await (await db.execute(
            "SELECT COUNT(*) FROM translations WHERE source_type='image'"
        )).fetchone())[0]
        today_count = (await (await db.execute(
            "SELECT COUNT(*) FROM translations WHERE created_at LIKE ?",
            (today + "%",),
        )).fetchone())[0]
    return StatsOut(
        totalTranslations=total,
        textTranslations=text_count,
        imageTranslations=image_count,
        todayCount=today_count,
    )


# ─── Entry point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
