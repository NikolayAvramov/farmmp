"use client";

import Link from "next/link";
import { useState } from "react";
import type { HealthStatus, PlantDiagnosisResult } from "@/lib/plant-diagnosis-types";
import { diagnosePlantImage } from "@/lib/supabase/diagnose";

const healthBg: Record<HealthStatus, string> = {
  healthy: "bg-farm-moss/15 text-farm-forest border-farm-moss/30",
  stress: "bg-farm-wheat/35 text-farm-bark border-farm-wheat-dim/40",
  disease: "bg-farm-terracotta/15 text-farm-bark border-farm-terracotta/35",
  unknown: "bg-farm-parchment text-farm-bark border-farm-bark/20",
};

const healthLabel: Record<HealthStatus, string> = {
  healthy: "Изглежда здраво",
  stress: "Има признаци на стрес",
  disease: "Възможен проблем / болест",
  unknown: "Неясно състояние",
};

async function fileToDataUrl(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Неуспешно четене на снимката"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Невалиден формат на снимката"));
    el.src = raw;
  });

  const maxSide = 1024;
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return raw;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function DiagnoseClient() {
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<PlantDiagnosisResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setResult(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      setPreview(dataUrl);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Грешка при обработка на снимката");
    }
  }

  async function analyze() {
    if (!preview) {
      setErr("Първо качи или направи снимка.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const data = await diagnosePlantImage({ imageDataUrl: preview, notes: notes.trim() || null });
      setResult(data);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Грешка при анализ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {err ? (
        <p className="rounded-xl border border-farm-terracotta/30 bg-farm-terracotta/15 px-3 py-2 text-sm font-medium text-farm-bark">
          {err}
        </p>
      ) : null}

      <section className="farm-card space-y-3 p-4">
        <p className="text-sm text-farm-bark/80">
          Качи снимка на лист, стебло или плод. AI ще опита да разпознае растението и да отбележи възможни проблеми.
        </p>
        <p className="rounded-lg bg-farm-cream/70 px-3 py-2 text-xs text-farm-bark/70">
          Безплатно с Google Gemini ключ от{" "}
          <a href="https://aistudio.google.com/apikey" className="font-semibold text-farm-moss underline" target="_blank" rel="noreferrer">
            aistudio.google.com/apikey
          </a>
          . Добави го в <code className="text-farm-bark">.env.local</code> като <code className="text-farm-bark">GEMINI_API_KEY</code> (може да започва с <code className="text-farm-bark">AQ.</code>).
        </p>
        <label className="farm-btn-primary flex min-h-12 cursor-pointer items-center justify-center rounded-xl text-sm">
          Снимай / избери снимка
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPickFile} />
        </label>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Избрана снимка" className="max-h-72 w-full rounded-xl object-cover" />
        ) : null}
        <label className="block text-sm font-semibold text-farm-bark/85">
          Допълнителен контекст (по избор)
          <textarea
            rows={2}
            className="farm-input mt-1.5 w-full px-3 py-2 text-base"
            placeholder="Напр. домати в оранжерия, жълти петна от 3 дни"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <button type="button" disabled={busy || !preview} onClick={analyze} className="farm-btn-dark min-h-12 w-full rounded-xl">
          {busy ? "Анализира се…" : "Анализирай снимката"}
        </button>
      </section>

      {result ? (
        <section className="farm-card space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl text-farm-forest">{result.plantName}</h2>
            {result.plantNameLatin ? <span className="text-sm italic text-farm-bark/60">{result.plantNameLatin}</span> : null}
          </div>
          <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${healthBg[result.healthStatus]}`}>
            {healthLabel[result.healthStatus]} · доверие: {result.confidence}
          </span>
          <p className="text-sm leading-relaxed text-farm-bark/85">{result.summary}</p>

          {result.possibleIssues.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-farm-forest">Възможни проблеми</p>
              <ul className="space-y-2">
                {result.possibleIssues.map((issue) => (
                  <li key={`${issue.name}-${issue.likelihood}`} className="rounded-xl border border-farm-bark/10 bg-farm-parchment/50 p-3">
                    <p className="font-semibold text-farm-bark">
                      {issue.name} <span className="text-xs text-farm-bark/60">({issue.likelihood})</span>
                    </p>
                    <p className="mt-1 text-sm text-farm-bark/75">{issue.symptoms}</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-farm-bark/80">
                      {issue.actions.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.careTips.length > 0 ? (
            <div>
              <p className="text-sm font-semibold text-farm-forest">Препоръки</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-farm-bark/80">
                {result.careTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="rounded-lg bg-farm-cream/70 px-3 py-2 text-xs text-farm-bark/70">{result.disclaimer}</p>

          <Link href="/tasks" className="inline-flex min-h-11 items-center rounded-xl border border-farm-moss/40 px-3 text-sm font-semibold text-farm-moss">
            Добави задача ръчно в „Задачи“
          </Link>
        </section>
      ) : null}
    </div>
  );
}
