// src/lib/types.ts

export interface HealthRecord {
  id: number;
  user_id: string;
  test_date: string;
  metric_name: string;
  metric_value: number;
  unit: string;
  notes: string | null;
  source: string;
  created_at: string;
  updated_at?: string | null;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParsedMetric {
  metric_name: string;
  metric_value: number;
  unit: string;
}

export interface ParsedHealthData {
  success: boolean;
  test_date: string | null;
  metrics?: ParsedMetric[];
  error?: string;
}

export const COMMON_METRICS = [
  { name: "Blood Glucose", unit: "mg/dL", category: "Diabetes" },
  { name: "HbA1c", unit: "%", category: "Diabetes" },
  { name: "Total Cholesterol", unit: "mg/dL", category: "Lipids" },
  { name: "HDL Cholesterol", unit: "mg/dL", category: "Lipids" },
  { name: "LDL Cholesterol", unit: "mg/dL", category: "Lipids" },
  { name: "Triglycerides", unit: "mg/dL", category: "Lipids" },
  { name: "Hemoglobin", unit: "g/dL", category: "Blood" },
  { name: "Red Blood Cells", unit: "million/µL", category: "Blood" },
  { name: "White Blood Cells", unit: "thousand/µL", category: "Blood" },
  { name: "Platelets", unit: "thousand/µL", category: "Blood" },
  { name: "Creatinine", unit: "mg/dL", category: "Kidney" },
  { name: "Urea", unit: "mg/dL", category: "Kidney" },
  { name: "TSH", unit: "mIU/L", category: "Thyroid" },
  { name: "T3", unit: "ng/dL", category: "Thyroid" },
  { name: "T4", unit: "µg/dL", category: "Thyroid" },
  { name: "Vitamin D", unit: "ng/mL", category: "Vitamins" },
  { name: "Vitamin B12", unit: "pg/mL", category: "Vitamins" },
  { name: "Iron", unit: "µg/dL", category: "Minerals" },
  { name: "Ferritin", unit: "ng/mL", category: "Minerals" },
];

export const METRIC_COLORS: Record<string, string> = {
  "Blood Glucose": "hsl(var(--chart-1))",
  "HbA1c": "hsl(var(--chart-2))",
  "Total Cholesterol": "hsl(var(--chart-3))",
  "HDL Cholesterol": "hsl(var(--chart-4))",
  "LDL Cholesterol": "hsl(var(--chart-5))",
  "Triglycerides": "hsl(var(--primary))",
  "Hemoglobin": "hsl(var(--accent))",
  default: "hsl(var(--chart-1))",
};