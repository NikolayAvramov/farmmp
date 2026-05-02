import type { SupabaseClient } from "@supabase/supabase-js";
import type { CropRow } from "@/lib/crop-types";
import { formatSupabaseTableError } from "@/lib/supabase/errors";

const SCHEMA = "supabase/schema.sql";

function fe(table: string, error: { message: string; code?: string }) {
  return formatSupabaseTableError(error, table, SCHEMA);
}

function fCrops(error: { message: string; code?: string }) {
  return formatSupabaseTableError(error, "crops", SCHEMA);
}

/** --- crops --- */
export type CropOption = { id: string; name: string; variety: string };

type CropRowDb = {
  id: string | number;
  name: string;
  variety: string;
  planting_date: string;
  field_location: string;
  status: string;
  created_at: string;
};

function toCropRow(r: CropRowDb): CropRow {
  const date =
    typeof r.planting_date === "string"
      ? r.planting_date.slice(0, 10)
      : String(r.planting_date).slice(0, 10);
  return {
    id: String(r.id),
    name: r.name,
    variety: r.variety,
    plantingDate: date,
    fieldLocation: r.field_location,
    status: r.status,
    createdAt: typeof r.created_at === "string" ? r.created_at : String(r.created_at),
  };
}

export async function dbListCropOptions(supabase: SupabaseClient): Promise<CropOption[]> {
  const { data, error } = await supabase
    .from("crops")
    .select("id, name, variety")
    .order("created_at", { ascending: false });
  if (error) throw new Error(fCrops(error));
  return ((data ?? []) as { id: string | number; name: string; variety: string }[]).map((r) => ({
    id: String(r.id),
    name: r.name,
    variety: r.variety,
  }));
}

export async function dbListCrops(supabase: SupabaseClient): Promise<CropRow[]> {
  const { data, error } = await supabase
    .from("crops")
    .select("id, name, variety, planting_date, field_location, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(fCrops(error));
  return ((data ?? []) as CropRowDb[]).map(toCropRow);
}

export async function dbInsertCrop(supabase: SupabaseClient, payload: Omit<CropRow, "id" | "createdAt">): Promise<void> {
  const { error } = await supabase.from("crops").insert({
    name: payload.name,
    variety: payload.variety,
    planting_date: payload.plantingDate,
    field_location: payload.fieldLocation,
    status: payload.status,
  });
  if (error) throw new Error(fCrops(error));
}

export async function dbUpdateCrop(
  supabase: SupabaseClient,
  id: string,
  payload: Omit<CropRow, "id" | "createdAt">,
): Promise<void> {
  const { error } = await supabase
    .from("crops")
    .update({
      name: payload.name,
      variety: payload.variety,
      planting_date: payload.plantingDate,
      field_location: payload.fieldLocation,
      status: payload.status,
    })
    .eq("id", id);
  if (error) throw new Error(fCrops(error));
}

/** --- tasks --- */
export type TaskRow = {
  id: string;
  type: string;
  status: string;
  dueDate: string;
  notes: string | null;
  cropId: string | null;
  crop: { id: string; name: string; variety: string } | null;
  createdAt: string;
};

type TaskDb = {
  id: string;
  type: string;
  status: string;
  due_date: string;
  notes: string | null;
  crop_id: string | number | null;
  created_at: string;
  crops:
    | { id: string | number; name: string; variety: string }
    | { id: string | number; name: string; variety: string }[]
    | null;
};

function mapTask(row: TaskDb): TaskRow {
  const raw = row.crops;
  const c = Array.isArray(raw) ? raw[0] : raw;
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    dueDate: typeof row.due_date === "string" ? row.due_date.slice(0, 10) : String(row.due_date),
    notes: row.notes,
    cropId: row.crop_id == null ? null : String(row.crop_id),
    crop: c && typeof c === "object" ? { id: String(c.id), name: c.name, variety: c.variety } : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : String(row.created_at),
  };
}

export async function dbListTasks(supabase: SupabaseClient): Promise<TaskRow[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, type, status, due_date, notes, crop_id, created_at, crops ( id, name, variety )")
    .order("created_at", { ascending: false });
  if (error) throw new Error(fe("tasks", error));
  return ((data ?? []) as TaskDb[]).map(mapTask);
}

export async function dbInsertTask(
  supabase: SupabaseClient,
  payload: { type: string; dueDate: string; notes: string | null; cropId: string | null },
): Promise<void> {
  const cropId =
    payload.cropId && payload.cropId !== ""
      ? Number.parseInt(payload.cropId, 10)
      : null;
  const { error } = await supabase.from("tasks").insert({
    type: payload.type,
    status: "PENDING",
    due_date: payload.dueDate,
    notes: payload.notes,
    crop_id: cropId != null && !Number.isNaN(cropId) ? cropId : null,
  });
  if (error) throw new Error(fe("tasks", error));
}

export type TaskPatch = {
  type?: string;
  status?: string;
  dueDate?: string;
  notes?: string | null;
  cropId?: string | null;
};

export async function dbUpdateTask(supabase: SupabaseClient, id: string, patch: TaskPatch): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.type !== undefined) row.type = patch.type;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.dueDate !== undefined) row.due_date = patch.dueDate;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.cropId !== undefined) {
    const cropPk =
      patch.cropId != null && patch.cropId !== ""
        ? Number.parseInt(patch.cropId, 10)
        : null;
    row.crop_id = cropPk != null && !Number.isNaN(cropPk) ? cropPk : null;
  }
  if (Object.keys(row).length === 0) {
    throw new Error("Няма полета за актуализация");
  }
  const { error } = await supabase.from("tasks").update(row).eq("id", id);
  if (error) throw new Error(fe("tasks", error));
}

/** --- inventory --- */
export type InventoryRow = {
  id: string;
  productLabel: string;
  quantityAvailable: string;
  unit: string;
  cropId: string | null;
  createdAt: string;
  cropLabel: string | null;
};

type InvDb = {
  id: string;
  product_label: string;
  quantity_available: number | string;
  unit: string;
  crop_id: string | number | null;
  created_at: string;
  crops:
    | { name: string; variety: string }
    | { name: string; variety: string }[]
    | null;
};

function mapInv(r: InvDb): InventoryRow {
  const raw = r.crops;
  const c = Array.isArray(raw) ? raw[0] : raw;
  const cropLabel = c && typeof c === "object" ? `${c.name} — ${c.variety}` : null;
  return {
    id: r.id,
    productLabel: r.product_label,
    quantityAvailable: String(r.quantity_available),
    unit: r.unit,
    cropId: r.crop_id == null ? null : String(r.crop_id),
    createdAt: typeof r.created_at === "string" ? r.created_at : String(r.created_at),
    cropLabel,
  };
}

export async function dbListInventory(supabase: SupabaseClient): Promise<InventoryRow[]> {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("id, product_label, quantity_available, unit, crop_id, created_at, crops ( name, variety )")
    .order("created_at", { ascending: false });
  if (error) throw new Error(fe("inventory_items", error));
  return ((data ?? []) as InvDb[]).map(mapInv);
}

export async function dbUpdateInventoryItem(
  supabase: SupabaseClient,
  id: string,
  patch: {
    productLabel?: string;
    quantityAvailable?: number;
    unit?: "KG" | "PCS";
    cropId?: string | null;
  },
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.productLabel !== undefined) row.product_label = patch.productLabel;
  if (patch.quantityAvailable !== undefined) row.quantity_available = patch.quantityAvailable;
  if (patch.unit !== undefined) row.unit = patch.unit;
  if (patch.cropId !== undefined) {
    const cropPk =
      patch.cropId != null && patch.cropId !== ""
        ? Number.parseInt(patch.cropId, 10)
        : null;
    row.crop_id = cropPk != null && !Number.isNaN(cropPk) ? cropPk : null;
  }
  if (Object.keys(row).length === 0) {
    throw new Error("Няма полета за актуализация");
  }
  const { error } = await supabase.from("inventory_items").update(row).eq("id", id);
  if (error) throw new Error(fe("inventory_items", error));
}

export async function dbAddHarvest(
  supabase: SupabaseClient,
  payload: { cropId: string; productLabel: string; quantity: number; unit: "KG" | "PCS" },
): Promise<void> {
  const cropPk = Number.parseInt(payload.cropId, 10);
  if (Number.isNaN(cropPk)) throw new Error("Невалидна култура");

  const { data: existing, error: findErr } = await supabase
    .from("inventory_items")
    .select("id, quantity_available")
    .eq("crop_id", cropPk)
    .eq("unit", payload.unit)
    .maybeSingle();

  if (findErr) throw new Error(fe("inventory_items", findErr));

  if (existing) {
    const cur = Number(existing.quantity_available);
    const { error } = await supabase
      .from("inventory_items")
      .update({
        quantity_available: cur + payload.quantity,
        product_label: payload.productLabel,
      })
      .eq("id", existing.id);
    if (error) throw new Error(fe("inventory_items", error));
  } else {
    const { error } = await supabase.from("inventory_items").insert({
      product_label: payload.productLabel,
      quantity_available: payload.quantity,
      unit: payload.unit,
      crop_id: cropPk,
    });
    if (error) throw new Error(fe("inventory_items", error));
  }
}

/** --- expenses --- */
export type ExpenseRow = {
  id: string;
  type: string;
  amount: string;
  spentAt: string;
  notes: string | null;
  createdAt: string;
};

type ExpDb = {
  id: string;
  type: string;
  amount: string;
  spent_at: string;
  notes: string | null;
  created_at: string;
};

function mapExp(r: ExpDb): ExpenseRow {
  return {
    id: r.id,
    type: r.type,
    amount: r.amount,
    spentAt: typeof r.spent_at === "string" ? r.spent_at.slice(0, 10) : String(r.spent_at),
    notes: r.notes,
    createdAt: typeof r.created_at === "string" ? r.created_at : String(r.created_at),
  };
}

export async function dbListExpenses(supabase: SupabaseClient): Promise<ExpenseRow[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, type, amount, spent_at, notes, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(fe("expenses", error));
  return ((data ?? []) as ExpDb[]).map(mapExp);
}

export async function dbUpdateExpense(
  supabase: SupabaseClient,
  id: string,
  patch: { type?: string; amount?: string; spentAt?: string; notes?: string | null },
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.type !== undefined) row.type = patch.type;
  if (patch.amount !== undefined) row.amount = patch.amount;
  if (patch.spentAt !== undefined) row.spent_at = patch.spentAt;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (Object.keys(row).length === 0) {
    throw new Error("Няма полета за актуализация");
  }
  const { error } = await supabase.from("expenses").update(row).eq("id", id);
  if (error) throw new Error(fe("expenses", error));
}

export async function dbInsertExpense(
  supabase: SupabaseClient,
  payload: { type: string; amount: string; spentAt: string; notes: string | null },
): Promise<void> {
  const { error } = await supabase.from("expenses").insert({
    type: payload.type,
    amount: payload.amount,
    spent_at: payload.spentAt,
    notes: payload.notes,
  });
  if (error) throw new Error(fe("expenses", error));
}

/** --- sales --- */
export type CustomerRow = { id: string; name: string; phone: string | null; createdAt: string };
export type SalesInventoryRow = {
  id: string;
  productLabel: string;
  quantityAvailable: string;
  unit: string;
  createdAt: string;
};
export type OrderRow = {
  id: string;
  orderedAt: string;
  customer: CustomerRow;
  items: {
    lineId: string;
    quantity: string;
    inventoryItem: { productLabel: string; unit: string };
  }[];
};

export async function dbListCustomers(supabase: SupabaseClient): Promise<CustomerRow[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, phone, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(fe("customers", error));
  return ((data ?? []) as { id: string; name: string; phone: string | null; created_at: string }[]).map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    createdAt: typeof r.created_at === "string" ? r.created_at : String(r.created_at),
  }));
}

export async function dbInsertCustomer(
  supabase: SupabaseClient,
  payload: { name: string; phone: string | null },
): Promise<void> {
  const { error } = await supabase.from("customers").insert({
    name: payload.name,
    phone: payload.phone,
  });
  if (error) throw new Error(fe("customers", error));
}

export async function dbUpdateCustomer(
  supabase: SupabaseClient,
  id: string,
  patch: { name?: string; phone?: string | null },
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (Object.keys(row).length === 0) {
    throw new Error("Няма полета за актуализация");
  }
  const { error } = await supabase.from("customers").update(row).eq("id", id);
  if (error) throw new Error(fe("customers", error));
}

export async function dbListInventoryForSales(supabase: SupabaseClient): Promise<SalesInventoryRow[]> {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("id, product_label, quantity_available, unit, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(fe("inventory_items", error));
  return (data ?? []).map(
    (r: {
      id: string;
      product_label: string;
      quantity_available: number | string;
      unit: string;
      created_at: string;
    }) => ({
      id: r.id,
      productLabel: r.product_label,
      quantityAvailable: String(r.quantity_available),
      unit: r.unit,
      createdAt: typeof r.created_at === "string" ? r.created_at : String(r.created_at),
    }),
  );
}

export async function dbInsertInventoryQuick(
  supabase: SupabaseClient,
  payload: { productLabel: string; quantityAvailable: number; unit: string },
): Promise<void> {
  const { error } = await supabase.from("inventory_items").insert({
    product_label: payload.productLabel,
    quantity_available: payload.quantityAvailable,
    unit: payload.unit,
    crop_id: null,
  });
  if (error) throw new Error(fe("inventory_items", error));
}

export async function dbListOrders(supabase: SupabaseClient): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("sales_orders")
    .select(
      `
      id,
      ordered_at,
      customers ( id, name, phone, created_at ),
      sales_order_lines ( id, quantity, product_label_snapshot, unit_snapshot )
    `,
    )
    .order("ordered_at", { ascending: false });

  if (error) throw new Error(fe("sales_orders", error));

  type RawLine = {
    id: string;
    quantity: number | string;
    product_label_snapshot: string;
    unit_snapshot: string;
  };
  type CustEmbed = { id: string; name: string; phone: string | null; created_at: string };
  type RawOrder = {
    id: string;
    ordered_at: string;
    customers: CustEmbed | CustEmbed[] | null;
    sales_order_lines: RawLine[] | null;
  };

  return ((data ?? []) as RawOrder[]).map((row) => {
    const c = row.customers;
    const rawC = Array.isArray(c) ? c[0] : c;
    const customer: CustomerRow = rawC
      ? {
          id: rawC.id,
          name: rawC.name,
          phone: rawC.phone,
          createdAt: typeof rawC.created_at === "string" ? rawC.created_at : String(rawC.created_at),
        }
      : { id: "", name: "?", phone: null, createdAt: "" };

    return {
      id: row.id,
      orderedAt: row.ordered_at,
      customer,
      items: (row.sales_order_lines ?? []).map((line) => ({
        lineId: line.id,
        quantity: String(line.quantity),
        inventoryItem: {
          productLabel: line.product_label_snapshot,
          unit: line.unit_snapshot,
        },
      })),
    };
  });
}

export async function dbUpdateOrder(
  supabase: SupabaseClient,
  id: string,
  patch: { customerId?: string; orderedAt?: string },
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.customerId !== undefined) row.customer_id = patch.customerId;
  if (patch.orderedAt !== undefined) row.ordered_at = patch.orderedAt;
  if (Object.keys(row).length === 0) {
    throw new Error("Няма полета за актуализация");
  }
  const { error } = await supabase.from("sales_orders").update(row).eq("id", id);
  if (error) throw new Error(fe("sales_orders", error));
}

export async function dbPlaceOrder(
  supabase: SupabaseClient,
  payload: { customerId: string; inventoryItemId: string; quantity: number },
): Promise<void> {
  const { data: inv, error: invErr } = await supabase
    .from("inventory_items")
    .select("id, product_label, unit, quantity_available")
    .eq("id", payload.inventoryItemId)
    .single();

  if (invErr) throw new Error(fe("inventory_items", invErr));
  if (!inv) throw new Error("Няма такъв продукт");

  const have = Number(inv.quantity_available);
  if (have < payload.quantity) {
    throw new Error(`Недостатъчна наличност (има ${have})`);
  }

  const newQty = have - payload.quantity;
  const { error: stockErr } = await supabase
    .from("inventory_items")
    .update({ quantity_available: newQty })
    .eq("id", payload.inventoryItemId);

  if (stockErr) throw new Error(fe("inventory_items", stockErr));

  const { data: order, error: orderErr } = await supabase
    .from("sales_orders")
    .insert({ customer_id: payload.customerId })
    .select("id")
    .single();

  if (orderErr) {
    await supabase.from("inventory_items").update({ quantity_available: have }).eq("id", payload.inventoryItemId);
    throw new Error(fe("sales_orders", orderErr));
  }

  const { error: lineErr } = await supabase.from("sales_order_lines").insert({
    order_id: order.id,
    inventory_item_id: payload.inventoryItemId,
    quantity: payload.quantity,
    product_label_snapshot: inv.product_label,
    unit_snapshot: inv.unit,
  });

  if (lineErr) {
    await supabase.from("sales_orders").delete().eq("id", order.id);
    await supabase.from("inventory_items").update({ quantity_available: have }).eq("id", payload.inventoryItemId);
    throw new Error(fe("sales_order_lines", lineErr));
  }
}
