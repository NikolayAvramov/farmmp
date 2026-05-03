import { apiGet, apiSend } from "@/lib/api/http";

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

export async function listTasks(): Promise<TaskRow[]> {
  return apiGet<TaskRow[]>("/api/tasks");
}

export async function insertTask(payload: {
  type: string;
  dueDate: string;
  notes: string | null;
  cropId: string | null;
}): Promise<void> {
  await apiSend("/api/tasks", "POST", payload);
}

export async function updateTaskStatus(id: string, status: string): Promise<void> {
  await apiSend(`/api/tasks/${encodeURIComponent(id)}`, "PATCH", { status });
}

export type TaskPatch = {
  type?: string;
  status?: string;
  dueDate?: string;
  notes?: string | null;
  cropId?: string | null;
};

export async function updateTask(id: string, patch: TaskPatch): Promise<void> {
  await apiSend(`/api/tasks/${encodeURIComponent(id)}`, "PATCH", patch);
}

export async function deleteTask(id: string): Promise<void> {
  await apiSend(`/api/tasks/${encodeURIComponent(id)}`, "DELETE");
}
