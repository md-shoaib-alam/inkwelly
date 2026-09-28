export type ReportType = "schools" | "students" | "parents" | "users";
export type ExportFormat = "csv" | "excel" | "pdf";

export interface ColumnDefinition {
  id: string;
  label: string;
}
