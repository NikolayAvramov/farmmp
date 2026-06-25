import type { PlantDiagnosisResult } from "@/lib/plant-diagnosis-types";

const SYSTEM_PROMPT = `Ти си агрономичен асистент за млади фермери в България.
Анализираш снимки на растения и даваш практичен, кратък и честен отговор на български.
Не давай медицински или правни съвети. Ако не си сигурен, кажи го ясно.
Отговаряй САМО с валиден JSON без markdown, по тази schema:
{
  "plantName": "име на български",
  "plantNameLatin": "латинско име или null",
  "confidence": "high|medium|low",
  "healthStatus": "healthy|stress|disease|unknown",
  "summary": "1-2 изречения обобщение",
  "possibleIssues": [
    {
      "name": "проблем/болест/недостиг",
      "likelihood": "high|medium|low",
      "symptoms": "какво се вижда на снимката",
      "actions": ["конкретна стъпка 1", "конкретна стъпка 2"]
    }
  ],
  "careTips": ["съвет 1", "съвет 2"],
  "disclaimer": "кратко предупреждение че това е ориентир, не лабораторна диагноза"
}`;

/** gemini-2.0-flash was shut down 2026-06-01; try current free-tier models in order. */
const GEMINI_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3.5-flash",
] as const;

function geminiModelsToTry(): string[] {
  const override = process.env.GEMINI_MODEL?.trim().replace(/^["']|["']$/g, "");
  return override ? [override] : [...GEMINI_MODEL_FALLBACKS];
}

function quotaErrorMessage(status: number, detail: string): string {
  if (status === 429) {
    return "Безплатният лимит на Google Gemini е изчерпан за момента. Опитай отново след 15–60 минути или утре. Провери квотата в AI Studio → Usage.";
  }
  if (status === 404) {
    return "Избраният AI модел вече не е наличен. Рестартирай сървъра след обновление на приложението.";
  }
  return `AI услугата не отговори (${status}): ${detail.slice(0, 180)}`;
}

function parseResult(raw: string): PlantDiagnosisResult {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed = JSON.parse(cleaned) as PlantDiagnosisResult;
  if (!parsed.plantName || !parsed.summary) {
    throw new Error("Невалиден отговор от AI модела");
  }
  return {
    plantName: parsed.plantName,
    plantNameLatin: parsed.plantNameLatin ?? null,
    confidence: parsed.confidence ?? "low",
    healthStatus: parsed.healthStatus ?? "unknown",
    summary: parsed.summary,
    possibleIssues: Array.isArray(parsed.possibleIssues) ? parsed.possibleIssues : [],
    careTips: Array.isArray(parsed.careTips) ? parsed.careTips : [],
    disclaimer:
      parsed.disclaimer ??
      "Това е ориентировъчен анализ по снимка. За точна диагноза консултирай се с агроном.",
  };
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match?.[1] || !match[2]) {
    throw new Error("Невалиден формат на снимката");
  }
  return { mimeType: match[1], base64: match[2] };
}

export async function analyzePlantImage(params: {
  imageDataUrl: string;
  notes?: string | null;
}): Promise<PlantDiagnosisResult> {
  const apiKey = (process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY)?.trim().replace(/^["']|["']$/g, "");
  if (!apiKey) {
    throw new Error(
      "Липсва GEMINI_API_KEY. Вземи безплатен ключ от https://aistudio.google.com/apikey и го добави в .env.local",
    );
  }

  const userText =
    params.notes?.trim() ?
      `Допълнителен контекст от фермера: ${params.notes.trim()}`
    : "Няма допълнителен контекст от фермера.";

  const { mimeType, base64 } = parseDataUrl(params.imageDataUrl);

  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        parts: [
          { text: userText },
          { inlineData: { mimeType, data: base64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });

  const models = geminiModelsToTry();
  let lastStatus = 500;
  let lastDetail = "";

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: requestBody,
    });

    if (!res.ok) {
      lastStatus = res.status;
      lastDetail = await res.text();
      if (lastStatus === 429 || lastStatus === 404) continue;
      throw new Error(quotaErrorMessage(lastStatus, lastDetail));
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error("AI услугата върна празен отговор");
    return parseResult(content);
  }

  throw new Error(quotaErrorMessage(lastStatus, lastDetail));
}
