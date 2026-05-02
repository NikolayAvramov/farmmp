export type CropRow = {
  id: string;
  name: string;
  variety: string;
  plantingDate: string;
  fieldLocation: string;
  status: string;
  /** ISO timestamp от базата */
  createdAt: string;
};
