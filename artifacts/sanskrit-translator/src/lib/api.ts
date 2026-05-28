export type TranslationResult = {
  id: number;
  originalText: string;
  transliteration: string;
  englishTranslation: string;
  wordByWord: string | null;
  context: string | null;
  sourceType: "text" | "image";
  confidence: number;
  qualityScore?: number;
  createdAt: string;
};

export type Stats = {
  totalTranslations: number;
  textTranslations: number;
  imageTranslations: number;
  todayCount: number;
};

export async function translateImage(file: File): Promise<TranslationResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/py-api/translate/image", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Failed to translate image");
  return res.json();
}

export async function translateText(text: string): Promise<TranslationResult> {
  const res = await fetch("/py-api/translate/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  if (!res.ok) throw new Error("Failed to translate text");
  return res.json();
}

export async function getHistory(limit: number = 20): Promise<TranslationResult[]> {
  const res = await fetch(`/py-api/translate/history?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

export async function getStats(): Promise<Stats> {
  const res = await fetch("/py-api/translate/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}
