"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteExpense,
  insertExpense,
  listExpenses,
  updateExpense,
  type ExpenseRow,
} from "@/lib/supabase/expenses";

export function ExpensesClient() {
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const refresh = useCallback(async () => {
    setRows(await listExpenses());
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const amount = form.amount.trim();
      if (!form.type.trim() || !amount) {
        setErr("Попълни вид и сума");
        return;
      }
      await insertExpense({
        type: form.type.trim(),
        amount,
        spentAt: form.date,
        notes: form.notes.trim() || null,
      });
      await refresh();
      setForm((f) => ({ ...f, type: "", amount: "", notes: "" }));
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

      <form onSubmit={submit} className="farm-card space-y-3 p-4">
        <label className="block text-sm font-semibold text-farm-bark/85">
          Вид разход
          <input
            required
            placeholder="напр. гориво, семена"
            className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          />
        </label>
        <label className="block text-sm font-semibold text-farm-bark/85">
          Сума
          <input
            required
            inputMode="decimal"
            className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
        </label>
        <label className="block text-sm font-semibold text-farm-bark/85">
          Дата
          <input
            type="date"
            required
            className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
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
        <button type="submit" disabled={busy || loading} className="farm-btn-primary w-full min-h-14 rounded-2xl">
          Запиши разход
        </button>
      </form>

      <ul className="space-y-2">
        {rows.map((r) => (
          <ExpenseRecordCard
            key={r.id}
            row={r}
            busy={busy}
            loading={loading}
            onRefresh={refresh}
            onError={setErr}
            onBusy={setBusy}
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

function ExpenseRecordCard({
  row: r,
  busy,
  loading,
  onRefresh,
  onError,
  onBusy,
}: {
  row: ExpenseRow;
  busy: boolean;
  loading: boolean;
  onRefresh: () => Promise<void>;
  onError: (msg: string | null) => void;
  onBusy: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: r.type,
    amount: r.amount,
    spentAt: r.spentAt,
    notes: r.notes ?? "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        type: r.type,
        amount: r.amount,
        spentAt: r.spentAt,
        notes: r.notes ?? "",
      });
    }
  }, [open, r]);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    onBusy(true);
    onError(null);
    try {
      await updateExpense(r.id, {
        type: form.type.trim(),
        amount: form.amount.trim(),
        spentAt: form.spentAt,
        notes: form.notes.trim() || null,
      });
      await onRefresh();
      setOpen(false);
    } catch (ex) {
      onError(ex instanceof Error ? ex.message : "Грешка");
    } finally {
      onBusy(false);
    }
  }

  async function removeExpenseRow() {
    if (!confirm("Да изтриеш ли този разход?")) return;
    onBusy(true);
    onError(null);
    try {
      await deleteExpense(r.id);
      await onRefresh();
      setOpen(false);
    } catch (ex) {
      onError(ex instanceof Error ? ex.message : "Грешка");
    } finally {
      onBusy(false);
    }
  }

  return (
    <li className="farm-card px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-farm-forest">{r.type}</p>
          <p className="text-sm text-farm-bark/60">Разход: {r.spentAt}</p>
        </div>
        <span className="shrink-0 font-display text-lg font-semibold tabular-nums text-farm-bark">
          {r.amount}
        </span>
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
              <dd className="break-all font-mono text-[0.7rem]">{r.id}</dd>
            </div>
            <div>
              <dt className="font-semibold text-farm-bark/80">Запис в системата</dt>
              <dd>{formatTs(r.createdAt)}</dd>
            </div>
            {r.notes && (
              <div>
                <dt className="font-semibold text-farm-bark/80">Бележки</dt>
                <dd className="whitespace-pre-wrap">{r.notes}</dd>
              </div>
            )}
          </dl>
          <form onSubmit={saveEdit} className="space-y-3">
            <label className="block text-sm font-semibold text-farm-bark/85">
              Вид разход
              <input
                required
                className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              />
            </label>
            <label className="block text-sm font-semibold text-farm-bark/85">
              Сума
              <input
                required
                inputMode="decimal"
                className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </label>
            <label className="block text-sm font-semibold text-farm-bark/85">
              Дата на разход
              <input
                type="date"
                required
                className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
                value={form.spentAt}
                onChange={(e) => setForm((f) => ({ ...f, spentAt: e.target.value }))}
              />
            </label>
            <label className="block text-sm font-semibold text-farm-bark/85">
              Бележки
              <textarea
                rows={2}
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
            onClick={removeExpenseRow}
          >
            Изтрий записа
          </button>
        </div>
      )}
    </li>
  );
}
