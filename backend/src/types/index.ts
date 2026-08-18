// Database Model Types and DTOs for GreenOps AI - Phase 2

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface Project {
  id: string;
  user_id: string | null;
  name: string;
  repository_url: string | null;
  language: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectDTO {
  name: string;
  repositoryUrl?: string;
  repository_url?: string;
  language?: string;
  userId?: string;
  user_id?: string;
}

export interface UpdateProjectDTO {
  name?: string;
  repositoryUrl?: string;
  repository_url?: string;
  language?: string;
}

export type AnalysisType = "CODE" | "PR" | "BENCHMARK";
export type AnalysisStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";

export interface Analysis {
  id: string;
  project_id: string;
  type: AnalysisType;
  status: AnalysisStatus;
  commit_sha: string | null;
  created_at: Date;
  completed_at: Date | null;
}

export interface CodeFinding {
  id: string;
  analysis_id: string;
  file: string | null;
  line_start: number | null;
  line_end: number | null;
  category: string;
  severity: string;
  description: string;
  suggestion: string | null;
  created_at: Date;
}

export interface RuntimeMetric {
  id: string;
  analysis_id: string;
  execution_time: number;
  cpu_usage: number;
  cpu_time: number;
  memory_usage: number;
  network_bytes: number;
  api_calls: number;
  db_queries: number;
  created_at: Date;
}

export interface EnergyMeasurement {
  id: string;
  analysis_id: string;
  estimated_power: number;
  energy_wh: number;
  estimation_method: string;
  confidence: number;
  created_at: Date;
}

export interface CarbonMeasurement {
  id: string;
  energy_measurement_id: string;
  carbon_intensity: number;
  carbon_emissions_g: number;
  region: string;
  created_at: Date;
}

export interface Optimization {
  id: string;
  analysis_id: string;
  original_code: string;
  optimized_code: string;
  ai_explanation: string | null;
  status: string;
  created_at: Date;
}

export interface VerificationResult {
  id: string;
  optimization_id: string;
  before_energy: number;
  after_energy: number;
  before_carbon: number;
  after_carbon: number;
  energy_reduction_percent: number;
  carbon_reduction_percent: number;
  status: string;
  created_at: Date;
}

export interface HealthResponse {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  uptime: number;
  services: {
    api: string;
    database: string;
  };
}
