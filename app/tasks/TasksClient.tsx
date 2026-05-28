"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

const PRESET_TYPES = ["WATERING", "SPRAYING", "HARVESTING", "MOWING"] as const;
type PresetType = (typeof PRESET_TYPES)[number];
/** Стойност в `<select>` за произволно име на задача (реалният `type` в DB е текстът от полето). */
const OTHER_PRESET = "__OTHER__" as const;
type TypeSelectValue = PresetType | typeof OTHER_PRESET;

const typeBg: Record<PresetType, string> = {
  WATERING: "Поливане",
  SPRAYING: "Пръскане",
  HARVESTING: "Беритба",
  MOWING: "Косене",
};

function isPresetType(s: string): s is PresetType {
  return (PRESET_TYPES as readonly string[]).includes(s);
}

function fromStoredTaskType(stored: string): { preset: TypeSelectValue; customType: string } {
  if (isPresetType(stored)) return { preset: stored, customType: "" };
  return { preset: OTHER_PRESET, customType: stored };
}

function toStoredTaskType(preset: TypeSelectValue, customType: string): string {
  if (preset === OTHER_PRESET) return customType.trim();
  return preset;
}

function displayTypeLabel(type: string): string {
  if (isPresetType(type)) return typeBg[type];
  const autoTypeBg: Record<string, string> = {
    SEEDING: "Сеитба",
    HOEING: "Окопаване",
    FEEDING: "Подхранване",
    CARE: "Грижа",
  };
  if (autoTypeBg[type]) return autoTypeBg[type];
  return type.trim() || "Друго";
}

export function TasksClient() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [crops, setCrops] = useState<CropOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    typePreset: "WATERING" as TypeSelectValue,
    customType: "",
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

  const alertStats = useMemo(() => {
    const todayYmd = formatLocalYmd(new Date());
    const todayUtc = parseYmdToUtc(todayYmd);
    let overdue = 0;
    let soon = 0;
    for (const t of tasks) {
      if (String(t.status).toUpperCase() === "DONE") continue;
      const dueUtc = parseYmdToUtc(t.dueDate);
      if (Number.isNaN(dueUtc)) continue;
      const deltaDays = Math.floor((dueUtc - todayUtc) / (1000 * 60 * 60 * 24));
      if (deltaDays < 0) overdue += 1;
      else if (deltaDays <= 2) soon += 1;
    }
    return { overdue, soon };
  }, [tasks]);

  useEffect(() => {
    if (loading) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (alertStats.overdue === 0 && alertStats.soon === 0) return;

    const fingerprint = `${new Date().toISOString().slice(0, 10)}:${alertStats.overdue}:${alertStats.soon}`;
    const last = window.localStorage.getItem("tasks-alert-fingerprint");
    if (last === fingerprint) return;

    const text = `Просрочени: ${alertStats.overdue}, до 2 дни: ${alertStats.soon}.`;
    new Notification("Агро задачи", { body: text });
    window.localStorage.setItem("tasks-alert-fingerprint", fingerprint);
  }, [alertStats, loading]);

  useEffect(() => {
    if (loading) return;
    void fetch("/api/push/notify-due", { method: "POST" });
  }, [loading, alertStats.overdue, alertStats.soon]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const typeStored = toStoredTaskType(form.typePreset, form.customType);
      if (form.typePreset === OTHER_PRESET && !typeStored) {
        setErr("Напишете име на задачата при „Друго“.");
        return;
      }
      if (form.typePreset === "MOWING" && !form.notes.trim()) {
        setErr("За задача „Косене“ добави бележка къде ще се коси.");
        return;
      }
      await insertTask({
        type: typeStored,
        dueDate: form.dueDate,
        notes: form.notes.trim() || null,
        cropId: form.cropId || null,
      });
      await refresh();
      setForm((f) => ({ ...f, notes: "", customType: "" }));
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

      <TaskAlerts
        overdueCount={alertStats.overdue}
        soonCount={alertStats.soon}
        onEnableNotifications={() => {
          if (typeof window === "undefined" || !("Notification" in window)) return;
          void Notification.requestPermission();
        }}
      />

      <form onSubmit={addTask} className="farm-card space-y-3 p-4">
        <label className="block text-sm font-semibold text-farm-bark/85">
          Вид работа
          <select
            className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
            value={form.typePreset}
            onChange={(e) => {
              const v = e.target.value as TypeSelectValue;
              setForm((f) => ({
                ...f,
                typePreset: v,
                customType: v === OTHER_PRESET ? f.customType : "",
              }));
            }}
          >
            {PRESET_TYPES.map((t) => (
              <option key={t} value={t}>
                {typeBg[t]}
              </option>
            ))}
            <option value={OTHER_PRESET}>Друго…</option>
          </select>
        </label>
        {form.typePreset === OTHER_PRESET && (
          <label className="block text-sm font-semibold text-farm-bark/85">
            Име на задачата
            <input
              className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
              placeholder="Напр. Преглед на оранжерията"
              value={form.customType}
              onChange={(e) => setForm((f) => ({ ...f, customType: e.target.value }))}
              required
            />
          </label>
        )}
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
            placeholder={form.typePreset === "MOWING" ? "Напр. Косене около ягодите в блок Б2" : ""}
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
            typeLabel={displayTypeLabel}
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

function formatLocalYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseYmdToUtc(ymd: string) {
  const [yRaw, mRaw, dRaw] = ymd.split("-");
  const y = Number.parseInt(yRaw ?? "", 10);
  const m = Number.parseInt(mRaw ?? "", 10);
  const d = Number.parseInt(dRaw ?? "", 10);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    return Number.NaN;
  }
  return Date.UTC(y, m - 1, d);
}

function TaskAlerts({
  overdueCount,
  soonCount,
  onEnableNotifications,
}: {
  overdueCount: number;
  soonCount: number;
  onEnableNotifications: () => void;
}) {
  const hasWork = overdueCount > 0 || soonCount > 0;
  return (
    <section className="farm-card space-y-2 p-3">
      <p className="text-sm font-semibold text-farm-forest">Напомняния</p>
      {hasWork ? (
        <p className="text-sm text-farm-bark/80">
          Просрочени: <span className="font-semibold text-farm-terracotta">{overdueCount}</span> · Скоро:{" "}
          <span className="font-semibold text-farm-moss">{soonCount}</span>
        </p>
      ) : (
        <p className="text-sm text-farm-bark/70">Нямаш просрочени или спешни задачи.</p>
      )}
      <button type="button" className="farm-btn-dark min-h-11 rounded-xl px-3 text-sm" onClick={onEnableNotifications}>
        Включи известия в браузъра
      </button>
    </section>
  );
}

function formatTs(iso: string) {
  try {
    return new Date(iso).toLocaleString("bg-BG", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

/** dueDate идва като YYYY-MM-DD от API */
function formatDueDate(ymd: string) {
  try {
    return new Date(`${ymd}T12:00:00`).toLocaleDateString("bg-BG", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return ymd;
  }
}

function formatCreatedShort(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("bg-BG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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
  const [form, setForm] = useState(() => {
    const { preset, customType } = fromStoredTaskType(t.type);
    return {
      typePreset: preset,
      customType,
      cropId: t.cropId ?? "",
      dueDate: t.dueDate,
      notes: t.notes ?? "",
      status: t.status,
    };
  });

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    onBusy(true);
    onError(null);
    try {
      const typeStored = toStoredTaskType(form.typePreset, form.customType);
      if (form.typePreset === OTHER_PRESET && !typeStored) {
        onError("Напишете име на задачата при „Друго“.");
        return;
      }
      await updateTask(t.id, {
        type: typeStored,
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

  const notesTrim = t.notes?.trim() ?? "";

  return (
    <li className="farm-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="font-semibold leading-snug text-farm-forest">{typeLabel(t.type)}</p>
            {t.crop ? (
              <p className="mt-0.5 text-sm text-farm-bark/75">
                Култура:{" "}
                <span className="font-medium text-farm-bark/90">
                  {t.crop.name}
                  <span className="font-normal text-farm-bark/60"> · {t.crop.variety}</span>
                </span>
              </p>
            ) : (
              <p className="mt-0.5 text-sm italic text-farm-bark/50">Без избрана култура</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            <span className="text-farm-bark/70">
              Краен срок:{" "}
              <time dateTime={t.dueDate} className="font-semibold text-farm-bark/90">
                {formatDueDate(t.dueDate)}
              </time>
            </span>
            <span
              className={`inline-flex rounded-lg px-2 py-0.5 font-semibold ${
                t.status === "DONE"
                  ? "bg-farm-moss/20 text-farm-forest"
                  : "bg-farm-wheat/50 text-farm-bark"
              }`}
            >
              {t.status === "DONE" ? "Изпълнено" : "Чака"}
            </span>
            <span className="text-farm-bark/55">Създадена {formatCreatedShort(t.createdAt)}</span>
          </div>
          {notesTrim ? (
            <div className="rounded-lg border border-farm-bark/10 bg-farm-parchment/40 px-3 py-2">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-farm-sage">Бележки</p>
              <p className="mt-1 line-clamp-4 text-sm leading-relaxed whitespace-pre-wrap text-farm-bark/85">
                {notesTrim}
              </p>
            </div>
          ) : null}
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
        onClick={() => {
          if (!open) {
            const { preset, customType } = fromStoredTaskType(t.type);
            setForm({
              typePreset: preset,
              customType,
              cropId: t.cropId ?? "",
              dueDate: t.dueDate,
              notes: t.notes ?? "",
              status: t.status,
            });
          }
          setOpen((o) => !o);
        }}
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
                value={form.typePreset}
                onChange={(e) => {
                  const v = e.target.value as TypeSelectValue;
                  setForm((f) => ({
                    ...f,
                    typePreset: v,
                    customType: v === OTHER_PRESET ? f.customType : "",
                  }));
                }}
              >
                {PRESET_TYPES.map((x) => (
                  <option key={x} value={x}>
                    {typeBg[x]}
                  </option>
                ))}
                <option value={OTHER_PRESET}>Друго…</option>
              </select>
            </label>
            {form.typePreset === OTHER_PRESET && (
              <label className="block text-sm font-semibold text-farm-bark/85">
                Име на задачата
                <input
                  className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
                  value={form.customType}
                  onChange={(e) => setForm((f) => ({ ...f, customType: e.target.value }))}
                  required
                />
              </label>
            )}
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
