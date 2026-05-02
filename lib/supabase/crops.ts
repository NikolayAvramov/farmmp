import type { CropRow } from "@/lib/crop-types";
import { apiGet, apiSend } from "@/lib/api/http";

export type CropOption = { id: string; name: string; variety: string };

export async function listCropOptions(): Promise<CropOption[]> {
  return apiGet<CropOption[]>("/api/crops/options");
}

export async function listCropsFromSupabase(): Promise<CropRow[]> {
  return apiGet<CropRow[]>("/api/crops");
}

export async function createCropInSupabase(payload: Omit<CropRow, "id" | "createdAt">): Promise<void> {
  await apiSend("/api/crops", "POST", payload);
}

export async function updateCropInSupabase(
  id: string,
  payload: Omit<CropRow, "id" | "createdAt">,
): Promise<void> {
  await apiSend(`/api/crops/${encodeURIComponent(id)}`, "PATCH", payload);
}
