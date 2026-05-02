import { apiGet, apiSend } from "@/lib/api/http";

export type ExpenseRow = {
  id: string;
  type: string;
  amount: string;
  spentAt: string;
  notes: string | null;
  createdAt: string;
};

export async function listExpenses(): Promise<ExpenseRow[]> {
  return apiGet<ExpenseRow[]>("/api/expenses");
}

export async function insertExpense(payload: {
  type: string;
  amount: string;
  spentAt: string;
  notes: string | null;
}): Promise<void> {
  await apiSend("/api/expenses", "POST", payload);
}

export type ExpensePatch = {
  type?: string;
  amount?: string;
  spentAt?: string;
  notes?: string | null;
};

export async function updateExpense(id: string, patch: ExpensePatch): Promise<void> {
  await apiSend(`/api/expenses/${encodeURIComponent(id)}`, "PATCH", patch);
}
