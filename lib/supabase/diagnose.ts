import { apiSend } from "@/lib/api/http";
import type { DiagnoseRequestBody, PlantDiagnosisResult } from "@/lib/plant-diagnosis-types";

export async function diagnosePlantImage(payload: DiagnoseRequestBody): Promise<PlantDiagnosisResult> {
  return apiSend<PlantDiagnosisResult>("/api/diagnose", "POST", payload);
}
