"use client";

import { useEffect, useState } from "react";
import type { CropRow } from "@/lib/crop-types";
import { createCropInSupabase, listCropsFromSupabase, updateCropInSupabase } from "@/lib/supabase/crops";

const statuses = ["PLANTED", "GROWING", "HARVESTED"] as const;

const statusBg: Record<(typeof statuses)[number], string> = {
  PLANTED: "Засято",
  GROWING: "Расте",
  HARVESTED: "Прибрано",
};

export function CropsClient() {
  const [crops, setCrops] = useState<CropRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    variety: "",
    plantingDate: new Date().toISOString().slice(0, 10),
    fieldLocation: "",
    status: "PLANTED" as (typeof statuses)[number],
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listCropsFromSupabase();
        if (!cancelled) setCrops(list);
      } catch (e) {
        if (!cancelled) {
          setErr(
            e instanceof Error
              ? e.message
              : "Неуспешно зареждане от Supabase. Провери таблица public.crops, RLS и ключовете.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function addCrop(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const payload = {
        name: form.name.trim(),
        variety: form.variety.trim(),
        plantingDate: form.plantingDate,
        fieldLocation: form.fieldLocation.trim(),
        status: form.status,
      };

      await createCropInSupabase(payload);
      const list = await listCropsFromSupabase();
      setCrops(list);

      setForm((f) => ({
        ...f,
        name: "",
        variety: "",
        fieldLocation: "",
      }));
      setOpen(false);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Грешка при запис");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {err && (
        <p
          className="rounded-xl border border-farm-terracotta/30 bg-farm-terracotta/15 px-3 py-2 text-sm font-medium text-farm-bark"
          role="alert"
        >
          {err}
        </p>
      )}

      {loading && (
        <p className="text-center text-sm text-farm-bark/70">Зареждане от базата…</p>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="farm-btn-primary min-h-14 w-full rounded-2xl text-lg sm:w-auto sm:min-w-[12rem]"
      >
        {open ? "Затвори формата" : "+ Нова култура"}
      </button>

      {open && (
        <form onSubmit={addCrop} className="farm-card space-y-3 p-4">
          <label className="block text-sm font-semibold text-farm-bark/85">
            Култура
            <input
              required
              className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="block text-sm font-semibold text-farm-bark/85">
            Сорт
            <input
              required
              className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
              value={form.variety}
              onChange={(e) => setForm((f) => ({ ...f, variety: e.target.value }))}
            />
          </label>
          <label className="block text-sm font-semibold text-farm-bark/85">
            Дата на засяване
            <input
              type="date"
              required
              className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
              value={form.plantingDate}
              onChange={(e) => setForm((f) => ({ ...f, plantingDate: e.target.value }))}
            />
          </label>
          <label className="block text-sm font-semibold text-farm-bark/85">
            Блок / лехи
            <input
              required
              className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
              value={form.fieldLocation}
              onChange={(e) => setForm((f) => ({ ...f, fieldLocation: e.target.value }))}
            />
          </label>
          <label className="block text-sm font-semibold text-farm-bark/85">
            Състояние
            <select
              className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as (typeof statuses)[number] }))
              }
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {statusBg[s]}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={busy || loading} className="farm-btn-dark w-full min-h-14 rounded-2xl">
            Запази
          </button>
        </form>
      )}

      <ul className="space-y-3">
        {crops.map((c) => (
          <CropRecordCard
            key={c.id}
            crop={c}
            busy={busy}
            loading={loading}
            onSaved={async () => setCrops(await listCropsFromSupabase())}
            onError={setErr}
            onBusy={setBusy}
          />
        ))}
      </ul>

      {crops.length === 0 && !open && !loading && (
        <p className="text-center text-farm-bark/55">
          Няма култури в базата. Добави от формата или създай таблица <code className="text-farm-moss">crops</code>{" "}
          (виж <code className="text-farm-moss">supabase/schema.sql</code>).
        </p>
      )}
    </div>
  );
}

function formatTs(iso: string) {
  try {
    return new Date(iso).toLocaleString("bg-BG", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function CropRecordCard({
  crop: c,
  busy,
  loading,
  onSaved,
  onError,
  onBusy,
}: {
  crop: CropRow;
  busy: boolean;
  loading: boolean;
  onSaved: () => Promise<void>;
  onError: (msg: string | null) => void;
  onBusy: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: c.name,
    variety: c.variety,
    plantingDate: c.plantingDate,
    fieldLocation: c.fieldLocation,
    status: c.status as (typeof statuses)[number],
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: c.name,
        variety: c.variety,
        plantingDate: c.plantingDate,
        fieldLocation: c.fieldLocation,
        status: (statuses.includes(c.status as (typeof statuses)[number])
          ? c.status
          : "PLANTED") as (typeof statuses)[number],
      });
    }
  }, [open, c]);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    onBusy(true);
    onError(null);
    try {
      await updateCropInSupabase(c.id, {
        name: form.name.trim(),
        variety: form.variety.trim(),
        plantingDate: form.plantingDate,
        fieldLocation: form.fieldLocation.trim(),
        status: form.status,
      });
      await onSaved();
      setOpen(false);
    } catch (ex) {
      onError(ex instanceof Error ? ex.message : "Грешка при запис");
    } finally {
      onBusy(false);
    }
  }

  return (
    <li className="farm-card p-4">
      <p className="font-display text-lg font-semibold text-farm-forest">
        {c.name} <span className="font-sans font-medium text-farm-bark/65">· {c.variety}</span>
      </p>
      <p className="mt-1 text-sm text-farm-bark/70">
        {c.fieldLocation} · засято {String(c.plantingDate).slice(0, 10)} ·{" "}
        <span className="font-medium text-farm-moss">
          {statusBg[c.status as (typeof statuses)[number]] ?? c.status}
        </span>
      </p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-3 text-sm font-semibold text-farm-moss underline-offset-2 hover:underline"
      >
        {open ? "Скрий детайли" : "Детайли и редакция"}
      </button>
      {open && (
        <div className="mt-3 space-y-3 border-t border-farm-bark/10 pt-3">
          <dl className="space-y-1 text-xs text-farm-bark/70">
            <div className="flex gap-2">
              <dt className="shrink-0 font-semibold text-farm-bark/80">ID</dt>
              <dd className="break-all font-mono text-[0.7rem]">{c.id}</dd>
            </div>
            <div>
              <dt className="font-semibold text-farm-bark/80">Създаден</dt>
              <dd>{formatTs(c.createdAt)}</dd>
            </div>
          </dl>
          <form onSubmit={saveEdit} className="space-y-3">
            <label className="block text-sm font-semibold text-farm-bark/85">
              Култура
              <input
                required
                className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="block text-sm font-semibold text-farm-bark/85">
              Сорт
              <input
                required
                className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
                value={form.variety}
                onChange={(e) => setForm((f) => ({ ...f, variety: e.target.value }))}
              />
            </label>
            <label className="block text-sm font-semibold text-farm-bark/85">
              Дата на засяване
              <input
                type="date"
                required
                className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
                value={form.plantingDate}
                onChange={(e) => setForm((f) => ({ ...f, plantingDate: e.target.value }))}
              />
            </label>
            <label className="block text-sm font-semibold text-farm-bark/85">
              Блок / лехи
              <input
                required
                className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
                value={form.fieldLocation}
                onChange={(e) => setForm((f) => ({ ...f, fieldLocation: e.target.value }))}
              />
            </label>
            <label className="block text-sm font-semibold text-farm-bark/85">
              Състояние
              <select
                className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as (typeof statuses)[number] }))
                }
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {statusBg[s]}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={busy || loading} className="farm-btn-dark w-full min-h-12 rounded-2xl">
              Запази промените
            </button>
          </form>
        </div>
      )}
    </li>
  );
}
