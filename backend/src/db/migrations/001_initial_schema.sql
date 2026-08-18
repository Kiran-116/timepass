-- GreenOps AI - Phase 2 Initial Schema Migration
-- Creates all 9 core relational tables, indexes, and constraints

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  repository_url VARCHAR(512),
  language VARCHAR(64) NOT NULL DEFAULT 'python',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. analyses
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL DEFAULT 'CODE', -- 'CODE', 'PR', 'BENCHMARK'
  status VARCHAR(32) NOT NULL DEFAULT 'QUEUED', -- 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'
  commit_sha VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 4. code_findings
CREATE TABLE IF NOT EXISTS code_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  file VARCHAR(512),
  line_start INTEGER,
  line_end INTEGER,
  category VARCHAR(64) NOT NULL,
  severity VARCHAR(32) NOT NULL,
  description TEXT NOT NULL,
  suggestion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. runtime_metrics
CREATE TABLE IF NOT EXISTS runtime_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  execution_time DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  cpu_usage DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  cpu_time DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  memory_usage DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  network_bytes BIGINT NOT NULL DEFAULT 0,
  api_calls INTEGER NOT NULL DEFAULT 0,
  db_queries INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. energy_measurements
CREATE TABLE IF NOT EXISTS energy_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  estimated_power DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  energy_wh DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  estimation_method VARCHAR(64) NOT NULL DEFAULT 'power_model',
  confidence DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. carbon_measurements
CREATE TABLE IF NOT EXISTS carbon_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  energy_measurement_id UUID NOT NULL REFERENCES energy_measurements(id) ON DELETE CASCADE,
  carbon_intensity DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  carbon_emissions_g DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  region VARCHAR(64) NOT NULL DEFAULT 'global',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. optimizations
CREATE TABLE IF NOT EXISTS optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  original_code TEXT NOT NULL,
  optimized_code TEXT NOT NULL,
  ai_explanation TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. verification_results
CREATE TABLE IF NOT EXISTS verification_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_id UUID NOT NULL REFERENCES optimizations(id) ON DELETE CASCADE,
  before_energy DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  after_energy DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  before_carbon DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  after_carbon DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  energy_reduction_percent DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  carbon_reduction_percent DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for optimal relational query performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_project_id ON analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_code_findings_analysis_id ON code_findings(analysis_id);
CREATE INDEX IF NOT EXISTS idx_runtime_metrics_analysis_id ON runtime_metrics(analysis_id);
CREATE INDEX IF NOT EXISTS idx_energy_measurements_analysis_id ON energy_measurements(analysis_id);
CREATE INDEX IF NOT EXISTS idx_carbon_measurements_energy_id ON carbon_measurements(energy_measurement_id);
CREATE INDEX IF NOT EXISTS idx_optimizations_analysis_id ON optimizations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_verification_results_opt_id ON verification_results(optimization_id);
