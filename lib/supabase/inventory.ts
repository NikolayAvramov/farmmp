import { apiGet, apiSend } from "@/lib/api/http";

export type InventoryRow = {
  id: string;
  productLabel: string;
  quantityAvailable: string;
  unit: string;
  cropId: string | null;
  createdAt: string;
  cropLabel: string | null;
};

export async function listInventoryItems(): Promise<InventoryRow[]> {
  return apiGet<InventoryRow[]>("/api/inventory");
}

export async function addHarvestToInventory(payload: {
  cropId: string;
  productLabel: string;
  quantity: number;
  unit: "KG" | "PCS";
}): Promise<void> {
  await apiSend("/api/inventory/harvest", "POST", payload);
}

export type InventoryPatch = {
  productLabel?: string;
  quantityAvailable?: number;
  unit?: "KG" | "PCS";
  cropId?: string | null;
};

export async function updateInventoryItem(id: string, patch: InventoryPatch): Promise<void> {
  await apiSend(`/api/inventory/${encodeURIComponent(id)}`, "PATCH", patch);
}

export async function deleteInventoryItem(id: string): Promise<void> {
  await apiSend(`/api/inventory/${encodeURIComponent(id)}`, "DELETE");
}
