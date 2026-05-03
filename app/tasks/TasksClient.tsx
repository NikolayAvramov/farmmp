"use client";

import { useCallback, useEffect, useState } from "react";
import type { CropOption } from "@/lib/supabase/crops";
import { listCropOptions } from "@/lib/supabase/crops";
import {
  deleteTask,
  insertTask,
  listTasks,
  updateTask,
  updateTaskStatus,
  type TaskRow,
} from "@/lib/supabase/tasks";

const types = ["WATERING", "SPRAYING", "HARVESTING"] as const;

const typeBg: Record<(typeof types)[number], string> = {
  WATERING: "Поливане",
  SPRAYING: "Пръскане",
  HARVESTING: "Беритба",
};

export function TasksClient() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [crops, setCrops] = useState<CropOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "WATERING" as (typeof types)[number],
    cropId: "",
    dueDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const refresh = useCallback(async () => {
    const [t, c] = await Promise.all([listTasks(), listCropOptions()]);
    setTasks(t);
    setCrops(c);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Грешка при зареждане");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await insertTask({
        type: form.type,
        dueDate: form.dueDate,
        notes: form.notes.trim() || null,
        cropId: form.cropId || null,
      });
      await refresh();
      setForm((f) => ({ ...f, notes: "" }));
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Грешка");
    } finally {
      setBusy(false);
    }
  }

  async function toggleDone(t: TaskRow) {
    setBusy(true);
    setErr(null);
    try {
      const next = t.status === "DONE" ? "PENDING" : "DONE";
      await updateTaskStatus(t.id, next);
      await refresh();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Грешка");
    } finally {
      setBusy(false);
    }
  }

  function typeLabel(t: string) {
    return typeBg[t as (typeof types)[number]] ?? t;
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
        <p className="text-sm text-farm-bark/70">Зареждане от Supabase…</p>
      )}

      <form onSubmit={addTask} className="farm-card space-y-3 p-4">
        <label className="block text-sm font-semibold text-farm-bark/85">
          Вид работа
          <select
            className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
            value={form.type}
            onChange={(e) =>
              setForm((f) => ({ ...f, type: e.target.value as (typeof types)[number] }))
            }
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {typeBg[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-farm-bark/85">
          Култура (по избор)
          <select
            className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
            value={form.cropId}
            onChange={(e) => setForm((f) => ({ ...f, cropId: e.target.value }))}
          >
            <option value="">—</option>
            {crops.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.variety})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-farm-bark/85">
          Краен срок
          <input
            type="date"
            required
            className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
            value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
          />
        </label>
        <label className="block text-sm font-semibold text-farm-bark/85">
          Бележки
          <input
            className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </label>
        <button
          type="submit"
          disabled={busy || loading}
          className="farm-btn-primary w-full min-h-14 rounded-2xl text-base"
        >
          Добави задача
        </button>
      </form>

      <ul className="space-y-2">
        {tasks.map((t) => (
          <TaskRecordCard
            key={t.id}
            task={t}
            crops={crops}
            busy={busy}
            loading={loading}
            typeLabel={typeLabel}
            onRefresh={refresh}
            onError={setErr}
            onBusy={setBusy}
            onToggleDone={toggleDone}
          />
        ))}
      </ul>
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

function TaskRecordCard({
  task: t,
  crops,
  busy,
  loading,
  typeLabel,
  onRefresh,
  onError,
  onBusy,
  onToggleDone,
}: {
  task: TaskRow;
  crops: CropOption[];
  busy: boolean;
  loading: boolean;
  typeLabel: (x: string) => string;
  onRefresh: () => Promise<void>;
  onError: (msg: string | null) => void;
  onBusy: (v: boolean) => void;
  onToggleDone: (t: TaskRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: t.type as (typeof types)[number],
    cropId: t.cropId ?? "",
    dueDate: t.dueDate,
    notes: t.notes ?? "",
    status: t.status,
  });

  useEffect(() => {
    if (open) {
      setForm({
        type: (types.includes(t.type as (typeof types)[number]) ? t.type : "WATERING") as (typeof types)[number],
        cropId: t.cropId ?? "",
        dueDate: t.dueDate,
        notes: t.notes ?? "",
        status: t.status,
      });
    }
  }, [open, t]);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    onBusy(true);
    onError(null);
    try {
      await updateTask(t.id, {
        type: form.type,
        dueDate: form.dueDate,
        notes: form.notes.trim() || null,
        cropId: form.cropId || null,
        status: form.status,
      });
      await onRefresh();
      setOpen(false);
    } catch (ex) {
      onError(ex instanceof Error ? ex.message : "Грешка");
    } finally {
      onBusy(false);
    }
  }

  async function removeTask() {
    if (!confirm("Да изтриеш ли тази задача?")) return;
    onBusy(true);
    onError(null);
    try {
      await deleteTask(t.id);
      await onRefresh();
      setOpen(false);
    } catch (ex) {
      onError(ex instanceof Error ? ex.message : "Грешка");
    } finally {
      onBusy(false);
    }
  }

  return (
    <li className="farm-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-farm-forest">
            {typeLabel(t.type)}
            {t.crop && (
              <span className="font-normal text-farm-bark/65"> · {t.crop.name}</span>
            )}
          </p>
          <p className="text-sm text-farm-bark/65">
            До {t.dueDate} · {t.status === "DONE" ? "Изпълнено" : "Чака"}
          </p>
        </div>
        <button
          type="button"
          disabled={busy || loading}
          onClick={() => onToggleDone(t)}
          className="farm-btn-dark min-h-12 min-w-[5.5rem] shrink-0 rounded-xl px-3 text-sm"
        >
          {t.status === "DONE" ? "Отвори" : "Готово"}
        </button>
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-2 text-sm font-semibold text-farm-moss underline-offset-2 hover:underline"
      >
        {open ? "Скрий детайли" : "Детайли и редакция"}
      </button>
      {open && (
        <div className="mt-3 space-y-3 border-t border-farm-bark/10 pt-3">
          <dl className="space-y-1 text-xs text-farm-bark/70">
            <div className="flex gap-2">
              <dt className="shrink-0 font-semibold text-farm-bark/80">ID</dt>
              <dd className="break-all font-mono text-[0.7rem]">{t.id}</dd>
            </div>
            <div>
              <dt className="font-semibold text-farm-bark/80">Създадена</dt>
              <dd>{formatTs(t.createdAt)}</dd>
            </div>
            {t.notes && (
              <div>
                <dt className="font-semibold text-farm-bark/80">Бележки (текущи)</dt>
                <dd className="whitespace-pre-wrap">{t.notes}</dd>
              </div>
            )}
          </dl>
          <form onSubmit={saveEdit} className="space-y-3">
            <label className="block text-sm font-semibold text-farm-bark/85">
              Вид работа
              <select
                className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value as (typeof types)[number] }))
                }
              >
                {types.map((x) => (
                  <option key={x} value={x}>
                    {typeBg[x]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-farm-bark/85">
              Култура
              <select
                className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
                value={form.cropId}
                onChange={(e) => setForm((f) => ({ ...f, cropId: e.target.value }))}
              >
                <option value="">—</option>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.variety})
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-farm-bark/85">
              Краен срок
              <input
                type="date"
                required
                className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </label>
            <label className="block text-sm font-semibold text-farm-bark/85">
              Статус
              <select
                className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="PENDING">Чака</option>
                <option value="DONE">Изпълнено</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-farm-bark/85">
              Бележки
              <textarea
                rows={3}
                className="farm-input mt-1.5 w-full px-3 py-2 text-base"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </label>
            <button type="submit" disabled={busy || loading} className="farm-btn-dark w-full min-h-12 rounded-2xl">
              Запази промените
            </button>
          </form>
          <button
            type="button"
            disabled={busy || loading}
            className="w-full rounded-2xl border-2 border-farm-terracotta/45 py-3 text-sm font-semibold text-farm-terracotta transition-colors active:bg-farm-terracotta/10"
            onClick={removeTask}
          >
            Изтрий записа
          </button>
        </div>
      )}
    </li>
  );
}
