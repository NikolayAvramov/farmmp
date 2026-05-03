"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteCustomer,
  deleteOrder,
  insertCustomer,
  listCustomers,
  listInventoryForSales,
  listOrders,
  placeOrder,
  updateCustomer,
  updateOrder,
  type CustomerRow,
  type InventoryRow,
  type OrderRow,
} from "@/lib/supabase/sales";

const unitBg: Record<string, string> = { KG: "кг", PCS: "бр." };

export function SalesClient() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [orderErr, setOrderErr] = useState<string | null>(null);

  const [custForm, setCustForm] = useState({ name: "", phone: "" });
  const [orderForm, setOrderForm] = useState({
    customerId: "",
    inventoryItemId: "",
    quantity: "",
  });

  function patchOrderForm(p: Partial<typeof orderForm>) {
    setOrderForm((f) => ({ ...f, ...p }));
    setOrderErr(null);
  }

  const refresh = useCallback(async () => {
    const [cust, inv, ord] = await Promise.all([
      listCustomers(),
      listInventoryForSales(),
      listOrders(),
    ]);
    setCustomers(cust);
    setInventory(inv);
    setOrders(ord);
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

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await insertCustomer({
        name: custForm.name.trim(),
        phone: custForm.phone.trim() || null,
      });
      await refresh();
      setCustForm({ name: "", phone: "" });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Грешка");
    } finally {
      setBusy(false);
    }
  }

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!orderForm.customerId || !orderForm.inventoryItemId || !orderForm.quantity) {
      setOrderErr("Попълнете клиент, продукт и количество");
      return;
    }
    setBusy(true);
    setOrderErr(null);
    try {
      const qty = Number(orderForm.quantity);
      if (Number.isNaN(qty) || qty <= 0) {
        setOrderErr("Невалидно количество");
        return;
      }
      await placeOrder({
        customerId: orderForm.customerId,
        inventoryItemId: orderForm.inventoryItemId,
        quantity: qty,
      });
      await refresh();
      setOrderForm((f) => ({ ...f, quantity: "" }));
    } catch (ex) {
      setOrderErr(ex instanceof Error ? ex.message : "Грешка");
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
        <h2 className="font-display text-lg font-semibold text-farm-forest">Нов клиент</h2>
        <form onSubmit={addCustomer} className="mt-3 space-y-3">
          <input
            required
            placeholder="Име"
            className="farm-input w-full min-h-12 px-3 text-base"
            value={custForm.name}
            onChange={(e) => setCustForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            placeholder="Телефон (по избор)"
            className="farm-input w-full min-h-12 px-3 text-base"
            value={custForm.phone}
            onChange={(e) => setCustForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <button type="submit" disabled={busy || loading} className="farm-btn-dark w-full min-h-12 rounded-2xl">
            Запази клиент
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-display mb-2 text-lg font-semibold text-farm-forest">Клиенти</h2>
        <ul className="space-y-2">
          {customers.map((c) => (
            <CustomerRecordCard
              key={c.id}
              customer={c}
              busy={busy}
              loading={loading}
              onRefresh={refresh}
              onError={setErr}
              onBusy={setBusy}
            />
          ))}
        </ul>
        {customers.length === 0 && !loading && (
          <p className="text-center text-sm text-farm-bark/55">Все още няма клиенти.</p>
        )}
      </section>

      <section className="farm-card p-4">
        <h2 className="font-display text-lg font-semibold text-farm-forest">Нова поръчка</h2>
        <form onSubmit={submitOrder} className="mt-3 space-y-3">
          <label className="block text-sm font-semibold text-farm-bark/85">
            Клиент
            <select
              required
              className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
              value={orderForm.customerId}
              onChange={(e) => patchOrderForm({ customerId: e.target.value })}
            >
              <option value="">Изберете…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-farm-bark/85">
            Продукт
            <select
              required
              className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
              value={orderForm.inventoryItemId}
              onChange={(e) => patchOrderForm({ inventoryItemId: e.target.value })}
            >
              <option value="">Изберете…</option>
              {inventory.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.productLabel} ({i.quantityAvailable} {unitBg[i.unit] ?? i.unit})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-farm-bark/85">
            Количество
            <input
              required
              inputMode="decimal"
              className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
              value={orderForm.quantity}
              onChange={(e) => patchOrderForm({ quantity: e.target.value })}
            />
          </label>
          {orderErr && (
            <p
              className="rounded-xl border border-farm-terracotta/30 bg-farm-terracotta/15 px-3 py-2 text-sm font-medium text-farm-bark"
              role="alert"
            >
              {orderErr}
            </p>
          )}
          <button type="submit" disabled={busy || loading} className="farm-btn-primary w-full min-h-14 rounded-2xl">
            Потвърди поръчка
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-display mb-2 text-lg font-semibold text-farm-forest">Последни поръчки</h2>
        <ul className="space-y-2">
          {orders.map((o) => (
            <OrderRecordCard
              key={o.id}
              order={o}
              customers={customers}
              busy={busy}
              loading={loading}
              unitBg={unitBg}
              onRefresh={refresh}
              onError={setErr}
              onBusy={setBusy}
            />
          ))}
        </ul>
        {orders.length === 0 && !loading && (
          <p className="text-center text-farm-bark/55">Все още няма поръчки.</p>
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

function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CustomerRecordCard({
  customer: c,
  busy,
  loading,
  onRefresh,
  onError,
  onBusy,
}: {
  customer: CustomerRow;
  busy: boolean;
  loading: boolean;
  onRefresh: () => Promise<void>;
  onError: (msg: string | null) => void;
  onBusy: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: c.name, phone: c.phone ?? "" });

  useEffect(() => {
    if (open) {
      setForm({ name: c.name, phone: c.phone ?? "" });
    }
  }, [open, c]);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    onBusy(true);
    onError(null);
    try {
      await updateCustomer(c.id, {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
      });
      await onRefresh();
      setOpen(false);
    } catch (ex) {
      onError(ex instanceof Error ? ex.message : "Грешка");
    } finally {
      onBusy(false);
    }
  }

  async function removeCustomerRow() {
    if (
      !confirm(
        "Да изтриеш ли клиента? Няма да стане, ако има поне една поръчка към него.",
      )
    ) {
      return;
    }
    onBusy(true);
    onError(null);
    try {
      await deleteCustomer(c.id);
      await onRefresh();
      setOpen(false);
    } catch (ex) {
      onError(ex instanceof Error ? ex.message : "Грешка");
    } finally {
      onBusy(false);
    }
  }

  return (
    <li className="farm-card px-4 py-3 text-sm">
      <p className="font-medium text-farm-forest">{c.name}</p>
      {c.phone && <p className="text-farm-bark/65">{c.phone}</p>}
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
              <dd className="break-all font-mono text-[0.7rem]">{c.id}</dd>
            </div>
            <div>
              <dt className="font-semibold text-farm-bark/80">Регистриран</dt>
              <dd>{formatTs(c.createdAt)}</dd>
            </div>
          </dl>
          <form onSubmit={saveEdit} className="space-y-3">
            <input
              required
              className="farm-input w-full min-h-12 px-3 text-base"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              placeholder="Телефон"
              className="farm-input w-full min-h-12 px-3 text-base"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <button type="submit" disabled={busy || loading} className="farm-btn-dark w-full min-h-12 rounded-2xl">
              Запази промените
            </button>
          </form>
          <button
            type="button"
            disabled={busy || loading}
            className="w-full rounded-2xl border-2 border-farm-terracotta/45 py-3 text-sm font-semibold text-farm-terracotta transition-colors active:bg-farm-terracotta/10"
            onClick={removeCustomerRow}
          >
            Изтрий записа
          </button>
        </div>
      )}
    </li>
  );
}

function OrderRecordCard({
  order: o,
  customers,
  busy,
  loading,
  unitBg,
  onRefresh,
  onError,
  onBusy,
}: {
  order: OrderRow;
  customers: CustomerRow[];
  busy: boolean;
  loading: boolean;
  unitBg: Record<string, string>;
  onRefresh: () => Promise<void>;
  onError: (msg: string | null) => void;
  onBusy: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customerId: o.customer.id,
    orderedAtLocal: toDatetimeLocalValue(o.orderedAt),
  });

  useEffect(() => {
    if (open) {
      setForm({
        customerId: o.customer.id,
        orderedAtLocal: toDatetimeLocalValue(o.orderedAt),
      });
    }
  }, [open, o]);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    onBusy(true);
    onError(null);
    try {
      const orderedAt = new Date(form.orderedAtLocal).toISOString();
      await updateOrder(o.id, {
        customerId: form.customerId,
        orderedAt,
      });
      await onRefresh();
      setOpen(false);
    } catch (ex) {
      onError(ex instanceof Error ? ex.message : "Грешка");
    } finally {
      onBusy(false);
    }
  }

  async function removeOrderRow() {
    if (
      !confirm(
        "Да изтриеш ли цялата поръчка? Редовете към нея също ще бъдат премахнати.",
      )
    ) {
      return;
    }
    onBusy(true);
    onError(null);
    try {
      await deleteOrder(o.id);
      await onRefresh();
      setOpen(false);
    } catch (ex) {
      onError(ex instanceof Error ? ex.message : "Грешка");
    } finally {
      onBusy(false);
    }
  }

  return (
    <li className="farm-card p-4 text-sm">
      <p className="font-medium text-farm-forest">
        {o.customer.name}{" "}
        <span className="font-normal text-farm-bark/55">
          · {new Date(o.orderedAt).toLocaleString("bg-BG")}
        </span>
      </p>
      <ul className="mt-2 space-y-1 text-farm-bark/75">
        {o.items.map((it) => (
          <li key={it.lineId}>
            {it.inventoryItem.productLabel}: {it.quantity}{" "}
            {unitBg[it.inventoryItem.unit] ?? it.inventoryItem.unit}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        className="mt-2 text-sm font-semibold text-farm-moss underline-offset-2 hover:underline"
      >
        {open ? "Скрий детайли" : "Детайли и редакция"}
      </button>
      {open && (
        <div className="mt-3 space-y-3 border-t border-farm-bark/10 pt-3">
          <dl className="space-y-1 text-xs text-farm-bark/70">
            <div className="flex gap-2">
              <dt className="shrink-0 font-semibold text-farm-bark/80">Поръчка ID</dt>
              <dd className="break-all font-mono text-[0.7rem]">{o.id}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 font-semibold text-farm-bark/80">Клиент ID</dt>
              <dd className="break-all font-mono text-[0.7rem]">{o.customer.id}</dd>
            </div>
            <div>
              <dt className="font-semibold text-farm-bark/80">Клиент — записан на</dt>
              <dd>{formatTs(o.customer.createdAt)}</dd>
            </div>
          </dl>
          <p className="text-xs font-semibold text-farm-bark/80">Редове</p>
          <ul className="space-y-1 font-mono text-[0.65rem] text-farm-bark/65">
            {o.items.map((it) => (
              <li key={it.lineId}>
                Ред {it.lineId.slice(0, 8)}… · {it.inventoryItem.productLabel}
              </li>
            ))}
          </ul>
          <form onSubmit={saveEdit} className="space-y-3">
            <label className="block text-sm font-semibold text-farm-bark/85">
              Клиент
              <select
                required
                className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
                value={form.customerId}
                onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-farm-bark/85">
              Дата и час на поръчка
              <input
                type="datetime-local"
                required
                className="farm-input mt-1.5 w-full min-h-12 px-3 text-base"
                value={form.orderedAtLocal}
                onChange={(e) => setForm((f) => ({ ...f, orderedAtLocal: e.target.value }))}
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
            onClick={removeOrderRow}
          >
            Изтрий поръчката
          </button>
        </div>
      )}
    </li>
  );
}
