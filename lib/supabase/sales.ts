import { apiGet, apiSend } from "@/lib/api/http";

export type CustomerRow = { id: string; name: string; phone: string | null; createdAt: string };
export type InventoryRow = {
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

export async function listCustomers(): Promise<CustomerRow[]> {
  return apiGet<CustomerRow[]>("/api/customers");
}

export async function insertCustomer(payload: { name: string; phone: string | null }): Promise<void> {
  await apiSend("/api/customers", "POST", payload);
}

export async function updateCustomer(
  id: string,
  patch: { name?: string; phone?: string | null },
): Promise<void> {
  await apiSend(`/api/customers/${encodeURIComponent(id)}`, "PATCH", patch);
}

export async function updateOrder(
  id: string,
  patch: { customerId?: string; orderedAt?: string },
): Promise<void> {
  await apiSend(`/api/orders/${encodeURIComponent(id)}`, "PATCH", patch);
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiSend(`/api/customers/${encodeURIComponent(id)}`, "DELETE");
}

export async function deleteOrder(id: string): Promise<void> {
  await apiSend(`/api/orders/${encodeURIComponent(id)}`, "DELETE");
}

export async function listInventoryForSales(): Promise<InventoryRow[]> {
  return apiGet<InventoryRow[]>("/api/sales/inventory");
}

export async function insertInventoryQuick(payload: {
  productLabel: string;
  quantityAvailable: number;
  unit: string;
}): Promise<void> {
  await apiSend("/api/sales/inventory-quick", "POST", payload);
}

export async function listOrders(): Promise<OrderRow[]> {
  return apiGet<OrderRow[]>("/api/orders");
}

export async function placeOrder(payload: {
  customerId: string;
  inventoryItemId: string;
  quantity: number;
}): Promise<void> {
  await apiSend("/api/orders", "POST", payload);
}
