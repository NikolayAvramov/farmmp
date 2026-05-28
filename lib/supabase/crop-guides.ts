import { apiGet, apiSend } from "@/lib/api/http";

export type CropGuideStep = {
  title: string;
  description: string;
  offsetDays: number;
  taskType: string;
};

export type CropGuideRow = {
  id: string;
  cropName: string;
  category: "VEGETABLE" | "FRUIT";
  imageUrl: string | null;
  summary: string;
  steps: CropGuideStep[];
  createdAt: string;
};

export async function listCropGuides(): Promise<CropGuideRow[]> {
  return apiGet<CropGuideRow[]>("/api/crop-guides");
}

export async function createCropGuide(payload: Omit<CropGuideRow, "id" | "createdAt">): Promise<void> {
  await apiSend("/api/crop-guides", "POST", payload);
}

export async function updateCropGuide(id: string, patch: Partial<Omit<CropGuideRow, "id" | "createdAt">>): Promise<void> {
  await apiSend(`/api/crop-guides/${encodeURIComponent(id)}`, "PATCH", patch);
}

export async function deleteCropGuide(id: string): Promise<void> {
  await apiSend(`/api/crop-guides/${encodeURIComponent(id)}`, "DELETE");
}
