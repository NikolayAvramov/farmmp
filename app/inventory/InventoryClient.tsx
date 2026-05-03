"use client";

import { useCallback, useEffect, useState } from "react";
import type { CropOption } from "@/lib/supabase/crops";
import { listCropOptions } from "@/lib/supabase/crops";
import {
  addHarvestToInventory,
  deleteInventoryItem,
  listInventoryItems,
  updateInventoryItem,
  type InventoryRow,
} from "@/lib/supabase/inventory";

const units = ["KG", "PCS"] as const;

const unitBg: Record<(typeof units)[number], string> = {
  KG: "кг",
  PCS: "бр.",
};

function emptyHarvestForm() {
  return {
    cropId: "",
    quantity: "",
    unit: "KG" as (typeof units)[number],
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  };
}

export function InventoryClient() {
  const [items, setItems] = useState<InventoryRow[]>([]);
  const [crops, setCrops] = useState<CropOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [harvest, setHarvest] = useState(emptyHarvestForm);

  const refresh = useCallback(async () => {
    const [inv, c] = await Promise.all([listInventoryItems(), listCropOptions()]);
    setItems(inv);
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

  async function logHarvest(e: React.FormEvent) {
    e.preventDefault();
    if (!harvest.cropId) {
      setErr("Изберете култура");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const crop = crops.find((c) => c.id === harvest.cropId);
      const label = crop ? `${crop.name} — ${crop.variety}` : "Реколта";
      const add = Number(harvest.quantity);
      if (Number.isNaN(add) || add <= 0) {
        setErr("Невалидно количество");
        return;
      }

      await addHarvestToInventory({
        cropId: harvest.cropId,
        productLabel: label,
        quantity: add,
        unit: harvest.unit,
      });
      await refresh();
      setHarvest(emptyHarvestForm());
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Грешка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
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

      <section className="farm-card p-4">
        <h2 className="font-display text-lg font-semibold text-farm-forest">
          Реколта (добавя към склад)
        </h2>
        <form onSubmit={logHarvest} className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-farm-bark/85">
            Култура
            <select
              required
              className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
              value={harvest.cropId}
              onChange={(e) => setHarvest((h) => ({ ...h, cropId: e.target.value }))}
            >
              <option value="">Изберете…</option>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.variety}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-farm-bark/85">
            Мерна единица
            <select
              className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
              value={harvest.unit}
              onChange={(e) =>
                setHarvest((h) => ({ ...h, unit: e.target.value as (typeof units)[number] }))
              }
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {unitBg[u]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-farm-bark/85">
            Количество ({unitBg[harvest.unit]})
            <input
              required
              inputMode="decimal"
              className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
              value={harvest.quantity}
              onChange={(e) => setHarvest((h) => ({ ...h, quantity: e.target.value }))}
            />
          </label>
          <label className="block text-sm font-semibold text-farm-bark/85">
            Дата
            <input
              type="date"
              required
              className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
              value={harvest.date}
              onChange={(e) => setHarvest((h) => ({ ...h, date: e.target.value }))}
            />
          </label>
          <label className="block text-sm font-semibold text-farm-bark/85">
            Бележки
            <input
              className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
              value={harvest.notes}
              onChange={(e) => setHarvest((h) => ({ ...h, notes: e.target.value }))}
            />
          </label>
          <button type="submit" disabled={busy || loading} className="farm-btn-primary w-full min-h-14 rounded-2xl">
            Запиши реколта
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-display mb-2 text-lg font-semibold text-farm-forest">Наличност</h2>
        <ul className="space-y-2">
          {items.map((i) => (
            <InventoryRecordCard
              key={i.id}
              item={i}
              crops={crops}
              busy={busy}
              loading={loading}
              unitBg={unitBg}
              onRefresh={refresh}
              onError={setErr}
              onBusy={setBusy}
            />
          ))}
        </ul>
        {items.length === 0 && !loading && (
          <p className="text-center text-farm-bark/55">Няма артикули в склада.</p>
        )}
      </section>
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

function InventoryRecordCard({
  item: i,
  crops,
  busy,
  loading,
  unitBg,
  onRefresh,
  onError,
  onBusy,
}: {
  item: InventoryRow;
  crops: CropOption[];
  busy: boolean;
  loading: boolean;
  unitBg: Record<(typeof units)[number], string>;
  onRefresh: () => Promise<void>;
  onError: (msg: string | null) => void;
  onBusy: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    productLabel: i.productLabel,
    quantityAvailable: i.quantityAvailable,
    unit: i.unit as (typeof units)[number],
    cropId: i.cropId ?? "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        productLabel: i.productLabel,
        quantityAvailable: i.quantityAvailable,
        unit: (units.includes(i.unit as (typeof units)[number]) ? i.unit : "KG") as (typeof units)[number],
        cropId: i.cropId ?? "",
      });
    }
  }, [open, i]);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number(form.quantityAvailable);
    if (Number.isNaN(qty) || qty < 0) {
      onError("Невалидно количество");
      return;
    }
    onBusy(true);
    onError(null);
    try {
      await updateInventoryItem(i.id, {
        productLabel: form.productLabel.trim(),
        quantityAvailable: qty,
        unit: form.unit,
        cropId: form.cropId || null,
      });
      await onRefresh();
      setOpen(false);
    } catch (ex) {
      onError(ex instanceof Error ? ex.message : "Грешка");
    } finally {
      onBusy(false);
    }
  }

  async function removeItem() {
    if (
      !confirm(
        "Да изтриеш ли този артикул? Няма да мине, ако участва в вече създадена поръчка (ред в sales).",
      )
    ) {
      return;
    }
    onBusy(true);
    onError(null);
    try {
      await deleteInventoryItem(i.id);
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
        <span className="min-w-0 font-medium text-farm-forest">{i.productLabel}</span>
        <span className="shrink-0 tabular-nums text-farm-bark/80">
          {i.quantityAvailable} {unitBg[i.unit as (typeof units)[number]] ?? i.unit}
        </span>
      </div>
      {i.cropLabel && (
        <p className="mt-1 text-xs text-farm-bark/60">Култура: {i.cropLabel}</p>
      )}
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
              <dd className="break-all font-mono text-[0.7rem]">{i.id}</dd>
            </div>
            <div>
              <dt className="font-semibold text-farm-bark/80">Създаден</dt>
              <dd>{formatTs(i.createdAt)}</dd>
            </div>
            {i.cropId && (
              <div>
                <dt className="font-semibold text-farm-bark/80">crop_id</dt>
                <dd className="font-mono">{i.cropId}</dd>
              </div>
            )}
          </dl>
          <form onSubmit={saveEdit} className="space-y-3">
            <label className="block text-sm font-semibold text-farm-bark/85">
              Наименование
              <input
                required
                className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
                value={form.productLabel}
                onChange={(e) => setForm((f) => ({ ...f, productLabel: e.target.value }))}
              />
            </label>
            <label className="block text-sm font-semibold text-farm-bark/85">
              Наличност
              <input
                required
                inputMode="decimal"
                className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
                value={form.quantityAvailable}
                onChange={(e) => setForm((f) => ({ ...f, quantityAvailable: e.target.value }))}
              />
            </label>
            <label className="block text-sm font-semibold text-farm-bark/85">
              Мерна единица
              <select
                className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
                value={form.unit}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unit: e.target.value as (typeof units)[number] }))
                }
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {unitBg[u]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-farm-bark/85">
              Култура (връзка)
              <select
                className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
                value={form.cropId}
                onChange={(e) => setForm((f) => ({ ...f, cropId: e.target.value }))}
              >
                <option value="">—</option>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.variety}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={busy || loading} className="farm-btn-dark w-full min-h-12 rounded-2xl">
              Запази промените
            </button>
          </form>
          <button
            type="button"
            disabled={busy || loading}
            className="w-full rounded-2xl border-2 border-farm-terracotta/45 py-3 text-sm font-semibold text-farm-terracotta transition-colors active:bg-farm-terracotta/10"
            onClick={removeItem}
          >
            Изтрий записа
          </button>
        </div>
      )}
    </li>
  );
}
