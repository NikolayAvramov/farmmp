export type DiagnosisConfidence = "high" | "medium" | "low";
export type HealthStatus = "healthy" | "stress" | "disease" | "unknown";

export type PossibleIssue = {
  name: string;
  likelihood: DiagnosisConfidence;
  symptoms: string;
  actions: string[];
};

export type PlantDiagnosisResult = {
  plantName: string;
  plantNameLatin: string | null;
  confidence: DiagnosisConfidence;
  healthStatus: HealthStatus;
  summary: string;
  possibleIssues: PossibleIssue[];
  careTips: string[];
  disclaimer: string;
};

export type DiagnoseRequestBody = {
  imageDataUrl: string;
  notes?: string | null;
};
