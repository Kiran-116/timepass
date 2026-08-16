GreenOps AI --- Complete Phase-by-Phase Execution Plan

Team Size

Team of 4

Goal

Build a credible hackathon MVP of GreenOps AI that:

Detects potentially energy-intensive software patterns → explains the
issue → proposes an optimization → benchmarks before/after → estimates
energy → converts energy to operational CO₂e → verifies whether the
optimization actually improved sustainability.

Core Principle

AI proposes. Measurement verifies.

0. Final MVP Definition

What we WILL build

Web dashboard

Code input / analysis

Static sustainability analysis

Runtime benchmark runner

CPU + memory + execution-time telemetry

Energy estimation

Carbon-intensity based CO₂e calculation

AI optimization suggestions

Before/after verification

Green Score

GitHub PR integration/reporting if time permits

Strong before/after demo

What we WILL NOT build initially

Full enterprise platform

Kubernetes optimization

Kafka

Microservices

Multiple databases

Physical power meters

Complete GPU energy modeling

Embodied carbon calculation

Multi-cloud optimization

Automatic production deployment

Automatic PR merging

Support for every programming language

Recommended MVP Languages

Start with: - Python - JavaScript / TypeScript

If time becomes constrained, prioritize Python only for the
benchmark engine and demo.

1. Team Structure

Member 1 --- Backend + Orchestration Lead

Owns: - Backend API - Database - Job orchestration - Analysis workflow -
API integration - Backend deployment

Member 2 --- Energy + Runtime Engineering Lead

Owns: - Docker sandbox - Benchmark runner - CPU telemetry - Memory
telemetry - Execution-time measurement - Energy estimation - Carbon
calculation - Verification metrics

Member 3 --- AI + Code Analysis Lead

Owns: - Static analysis - Code smell detection - LLM integration -
Optimization prompts - Structured AI output - Optimized-code
generation - Explanation engine

Member 4 --- Frontend + GitHub Integration Lead

Owns: - React dashboard - Code editor - Analysis UI - Green Score UI -
Before/after visualization - GitHub OAuth - GitHub PR integration - PR
report UI

2. Shared Repository Structure

greenops-ai/
│
├── apps/
│   ├── frontend/
│   └── backend/
│
├── services/
│   ├── code-analyzer/
│   ├── runtime-profiler/
│   ├── energy-engine/
│   ├── carbon-engine/
│   ├── ai-agent/
│   └── verification-engine/
│
├── packages/
│   ├── shared-types/
│   ├── config/
│   └── utils/
│
├── benchmark/
│   ├── workloads/
│   └── datasets/
│
├── docker/
│
├── docs/
│
├── .env.example
├── docker-compose.yml
└── README.md

Keep the architecture modular but deploy it as a modular monolith
for the hackathon.

3. Development Rules

Git Branching

main
develop
feature/<feature-name>
fix/<issue-name>

Pull Request Rules

Every PR should contain: - What changed - Why - How to test -
Screenshots if UI changed - Known limitations

Commit Convention

feat:
fix:
refactor:
docs:
test:
chore:

PHASE 1 --- Project Setup

Objective

Create a common development environment so all four members can start
working independently.

Tasks

Create GitHub repository

Create monorepo

Configure TypeScript

Configure ESLint + Prettier

Create .env.example

Create Docker Compose with:

frontend

backend

postgres

Do not add unnecessary infrastructure.

Acceptance Criteria

All four members can run:

docker compose up

and access the frontend, backend and PostgreSQL.

PHASE 2 --- Database + Backend Foundation

Owner

Member 1

Objective

Implement backend foundation and database schema.

Database Tables

users
projects
analyses
code_findings
runtime_metrics
energy_measurements
carbon_measurements
optimizations
verification_results

Backend Foundation

Implement:

GET /health

Expected:

{
  "status": "ok"
}

API Groups

/api/auth
/api/projects
/api/analyses
/api/benchmarks
/api/optimizations
/api/verifications
/api/github

Acceptance Criteria

Backend starts successfully

Database connects

Migrations work

Project CRUD works

Health endpoint works

PHASE 3 --- Frontend Foundation

Owner

Member 4

Objective

Build the core UI shell before connecting real data.

Pages

Dashboard

Show: - Green Score - Recent analyses - Energy - CO₂e - Recent PRs

Code Analysis

Include: - Language selector - Monaco code editor - Analyze button

Analysis Result

Show: - Green Score - Findings - Energy - CO₂e - Recommendations

Before / After

Show: - Runtime - CPU - Memory - Energy - CO₂e - Reduction %

Acceptance Criteria

Frontend routes work and can consume mocked API responses.

PHASE 4 --- Static Code Analyzer

Owner

Member 3

Objective

Detect a small number of high-value sustainability patterns.

Do NOT attempt to build a general-purpose static analyzer.

Detection #1 --- O(n²)

Detect nested iteration and report:

Potential compute hotspot

Reason:
Nested iteration can cause quadratic growth in computation.

Detection #2 --- N+1 Database Queries

Detect database operations inside loops.

Detection #3 --- Repeated API Calls

Detect API calls inside loops.

Detection #4 --- Redundant Computation

Detect repeated expensive expressions where practical.

Detection #5 --- Excessive Memory Allocation

Detect obvious repeated allocations where practical.

Output Schema

{
  "category": "N_PLUS_ONE_QUERY",
  "severity": "HIGH",
  "file": "service.py",
  "line": 42,
  "description": "...",
  "recommendation": "..."
}

Acceptance Criteria

Given intentionally inefficient code, the analyzer identifies the
expected hotspot with correct file/line information.

PHASE 5 --- Runtime Benchmark Engine

Owner

Member 2

Objective

Execute code safely and consistently.

Architecture

Code
 ↓
Docker Sandbox
 ↓
Benchmark
 ↓
Telemetry
 ↓
Result

Sandbox Requirements

CPU limits

Memory limits

Execution timeout

Restricted filesystem

No privileged mode

Network disabled by default unless required

Benchmark Output

{
  "executionTimeMs": 2410,
  "cpuUsagePercent": 82,
  "memoryMb": 184
}

Benchmark Strategy

Use: - 2 warm-up runs - 5 measured runs

Calculate: - median - average - min - max

Use the median as the primary comparison metric.

Acceptance Criteria

The same workload can be run repeatedly and produces reasonably stable
telemetry.

PHASE 6 --- Energy Estimation Engine

Owner

Member 2

Objective

Convert runtime telemetry into estimated energy.

Important Rule

Do NOT claim direct measurement unless actual energy telemetry is
available.

For the MVP:

Runtime telemetry
        ↓
Power model
        ↓
Estimated Power
        ↓
Energy

Basic Model

Energy (Wh)
=
Estimated Power (W)
×
Runtime (hours)

Power Model

Create a configurable hardware profile:

{
  "cpu": "demo-profile",
  "idlePowerW": 30,
  "activePowerW": 80
}

Create a replaceable PowerModel abstraction so it can later support
direct hardware/cloud telemetry.

Confidence

Store:

HIGH
MEDIUM
LOW

For model-based estimation, use MEDIUM unless direct energy
telemetry is available.

Acceptance Criteria

Given identical benchmark results, the engine produces deterministic
energy estimates.

PHASE 7 --- Carbon Engine

Owner

Member 2 + Member 1

Objective

Convert energy into operational CO₂e.

Formula

CO₂e =
Energy(kWh)
×
Carbon Intensity(gCO₂e/kWh)

Example

Energy = 0.05 Wh
       = 0.00005 kWh

Carbon intensity = 600 gCO₂e/kWh

CO₂e = 0.00005 × 600
     = 0.03 gCO₂e

Carbon Intensity Provider

Create:

CarbonIntensityProvider

with:

getCurrentIntensity(region)
getIntensity(timestamp, region)

The implementation can initially use a configured/static value if a live
provider is not yet integrated.

Clearly label this as an estimate.

Acceptance Criteria

Energy → CO₂e conversion is correct and unit-safe.

PHASE 8 --- AI Agent

Owner

Member 3

Objective

Make AI the reasoning and optimization layer.

The AI should NOT calculate carbon.

The AI receives:

Source code
+
Static findings
+
Runtime metrics
+
Energy result
+
CO₂e result

and provides:

Explanation
+
Optimization
+
Expected reasoning

Agent Workflow

Code
 ↓
Analyzer
 ↓
Finding
 ↓
AI Explainer
 ↓
AI Optimizer
 ↓
Optimized Code
 ↓
Verification

Structured AI Output

{
  "problem": "...",
  "whyItMatters": "...",
  "optimization": "...",
  "optimizedCode": "...",
  "expectedImpact": {
    "cpu": "lower",
    "runtime": "lower",
    "memory": "lower"
  }
}

The AI must NOT return fabricated numerical CO₂ reductions.

Acceptance Criteria

AI can take a known inefficient example and produce a valid optimization
that preserves functionality.

PHASE 9 --- Verification Engine

Owner

Member 2 + Member 3

Objective

This is the core differentiator of GreenOps.

AI proposes. Measurement verifies.

Process

Original Code
     ↓
Benchmark
     ↓
Metrics
     ↓
Energy
     ↓
CO₂e

Optimized Code
     ↓
Benchmark
     ↓
Metrics
     ↓
Energy
     ↓
CO₂e

       ↓
Compare
       ↓
Verify

Calculate

runtimeReduction%
energyReduction%
carbonReduction%
memoryReduction%

Verification Rule

Example:

Energy reduction > threshold
AND
functionality tests pass

→ VERIFIED

Otherwise:

REJECTED

Example

Before:
Energy = 0.061 Wh
CO₂e   = 0.043 g

After:
Energy = 0.020 Wh
CO₂e   = 0.014 g

Energy reduction = 67.2%

Status = VERIFIED

The system must also be able to reject an optimization that makes the
workload worse.

PHASE 10 --- Green Score

Owner

Member 1 + Member 3

Objective

Create the memorable product metric.

GREEN SCORE
     0–100

Potential dimensions: - Energy efficiency - Compute efficiency - Memory
efficiency - Network efficiency - Carbon efficiency

Keep the MVP formula simple and explainable.

Example:

Green Score: 86 / 100

Do not claim that the score is an industry standard. It is a GreenOps
product metric.

Acceptance Criteria

Deterministic for the same workload

Verified improvements can improve the score

PHASE 11 --- End-to-End Analysis Workflow

Objective

Connect all modules.

Developer
   ↓
Submit Code
   ↓
Backend
   ↓
Static Analyzer
   ↓
Findings
   ↓
AI Explanation
   ↓
AI Optimization
   ↓
Original Benchmark
   ↓
Optimized Benchmark
   ↓
Runtime Metrics
   ↓
Energy Engine
   ↓
Carbon Engine
   ↓
Verification Engine
   ↓
Green Score
   ↓
Frontend

Backend

POST /api/analyses

creates an analysis job.

Then:

GET /api/analyses/:analysisId

returns the result.

PHASE 12 --- Frontend Integration

Owner

Member 4

Connect real APIs.

Flow

Analyze Code
     ↓
POST /api/analyses
     ↓
analysisId
     ↓
Poll GET /api/analyses/:analysisId
     ↓
COMPLETED

Result UI

Show:

⚠ O(n²) computation
⚠ Repeated DB query

Energy: 0.061 Wh
CO₂e: 0.043 g
Green Score: 61/100

PHASE 13 --- Before / After Visualization

Owner

Member 4

This is the main WOW screen.

                 BEFORE       AFTER

Runtime            2.41s       0.73s
CPU                82%         39%
Memory             184MB       96MB
Energy             0.061Wh     0.020Wh
CO₂e               0.043g      0.014g

                         ↓

Energy Reduction              67%
CO₂e Reduction                67%

Verification                  ✅

Keep the visualization simple and focused.

PHASE 14 --- GitHub PR Integration

Owner

Member 4 + Member 1

Implement only after the local end-to-end flow works.

Workflow

GitHub PR
   ↓
Webhook
   ↓
GreenOps Backend
   ↓
Fetch PR diff
   ↓
Static analysis
   ↓
Benchmark
   ↓
Energy / CO₂e
   ↓
PR report

Example PR Comment

🌱 GreenOps Sustainability Report

Green Score: 74

Energy Impact: +18%
CO₂e Impact: +17%

⚠ Sustainability Regression

Potential causes:
• Increased API calls
• Increased DB queries
• Higher CPU time

GreenOps Recommendation:
Batch database requests.

Acceptance Criteria

A test PR triggers GreenOps and produces a sustainability report.

PHASE 15 --- GitHub Authentication

Owner

Member 4 + Member 1

Implement GitHub OAuth / GitHub App authentication.

Frontend
 ↓
GitHub Login
 ↓
GitHub OAuth
 ↓
Callback
 ↓
Backend
 ↓
Session

Then:

Select Repository
 ↓
Select PR
 ↓
Analyze PR

PHASE 16 --- Testing

Testing should happen continuously.

Unit Tests

Test: - API validation - Database operations - Analysis creation -
Energy calculation - Carbon calculation - Green Score

Static Analyzer Tests

Create known examples:

test_o_n2.py
test_n_plus_one.py
test_repeated_api.py
test_redundant_compute.py

Runtime Tests

Use: - fast workload - slow workload - memory-heavy workload

Confirm that slower/heavier workloads produce higher resource
measurements.

Verification Tests

Create: - a genuinely improved implementation - an unchanged/worse
implementation

Expected:

Improvement → VERIFIED
No improvement → REJECTED

PHASE 17 --- Accuracy / Credibility Validation

This phase is critical for judging.

Never claim

"Exact carbon emissions of this code."

Say

"Estimated operational energy and CO₂e impact."

Validate

Run the same workload multiple times and calculate:

mean
median
standard deviation

Use median for the main comparison.

Confidence Levels

HIGH

Direct energy telemetry available.

MEDIUM

Runtime telemetry + calibrated power model.

LOW

Static analysis only.

Static analysis must never claim measured CO₂e.

PHASE 18 --- Security

Because GreenOps executes code, security is critical.

Sandbox

Use Docker with: - CPU limit - memory limit - timeout - restricted
filesystem - non-root user - network disabled by default - container
cleanup

API Security

Implement: - request validation - rate limiting - authentication -
authorization - secret management

PHASE 19 --- Performance / Reliability

Long-running benchmark jobs must not block HTTP requests.

Job lifecycle:

QUEUED
  ↓
RUNNING
  ↓
COMPLETED

Failure:

FAILED

Implement: - benchmark timeout - job status - failure handling - retry
only where safe

PHASE 20 --- Deployment

Recommended

Frontend
   ↓
Cloud frontend hosting

Backend
   ↓
Cloud container

PostgreSQL
   ↓
Managed PostgreSQL

Benchmark Runner
   ↓
Docker-capable environment

If the deployment environment cannot safely run Docker, keep the
benchmark runner local for the demo and deploy the dashboard/backend
separately.

PHASE 21 --- Demo Workloads

Prepare 3--5 deterministic workloads.

Demo 1 --- O(n²) vs O(n)

Strongest demo.

Bad:
Nested loops

Good:
Hash/set based lookup

Show:

Runtime ↓
CPU ↓
Energy ↓
CO₂e ↓

Demo 2 --- N+1 Queries

1000 queries
      ↓
1 batched query

Show reductions in:

DB calls
Network
Runtime
Energy

Demo 3 --- Repeated API Calls

Many API requests
      ↓
Batched request

PHASE 22 --- The 3-Minute Winning Demo

Step 1 --- Problem

Show intentionally inefficient code.

Step 2 --- Detection

⚠ Energy Hotspot

O(n²) computation detected.

Step 3 --- Explanation

Nested iteration causes unnecessary computation
as input size increases.

Step 4 --- Optimization

Click:

Optimize

AI generates improved code.

Step 5 --- Benchmark

Run both versions.

Step 6 --- Evidence

BEFORE             AFTER

2.41 sec           0.73 sec
82% CPU            39% CPU
0.061 Wh           0.020 Wh
0.043 g CO₂e       0.014 g CO₂e

Step 7 --- Verification

Energy reduction: 67%

✅ Optimization verified

Step 8 --- Closing Line

"AI proposed the optimization. GreenOps measured it and proved the
improvement."

PHASE 23 --- Judge Question Preparation

Q1. How do you calculate carbon from code?

We don't calculate carbon directly from source code. We execute the
workload, collect runtime telemetry, estimate energy using a power
model, and convert energy to operational CO₂e using carbon intensity.

Q2. How accurate is it?

Our MVP provides an estimate rather than claiming exact electrical
measurement. We distinguish measured, estimated and static-analysis
results and expose a confidence level. Direct hardware/cloud energy
telemetry can replace the estimation model later.

Q3. Why can't ChatGPT do this?

An LLM can suggest an optimization, but it cannot prove that the
change reduced energy. GreenOps benchmarks both implementations,
estimates their energy consumption and verifies the actual change.

Q4. Why is this different from SonarQube?

SonarQube focuses on code quality and maintainability. GreenOps
focuses on runtime sustainability impact and connects code changes to
energy and operational CO₂e.

Q5. Why does a small optimization matter?

A small per-execution improvement becomes significant when the
workload runs thousands or millions of times.

Q6. What if the AI recommendation makes things worse?

GreenOps rejects it. AI proposes; the verification engine decides
based on benchmark results.

PHASE 24 --- Final Integration Checklist

Backend

Backend running

Database connected

APIs working

Error handling working

Static Analyzer

O(n²) detection

N+1 detection

API repetition detection

Runtime

Docker sandbox

CPU telemetry

Memory telemetry

Runtime measurement

Energy

Power model

Energy calculation

Confidence level

Carbon

Carbon intensity

CO₂e calculation

Units correct

AI

Explanation

Optimization

Structured output

No fabricated metrics

Verification

Before benchmark

After benchmark

Comparison

Verified/rejected status

Frontend

Code editor

Analysis screen

Findings

Green Score

Before/after

Charts

GitHub

OAuth/App

PR detection

Diff analysis

PR comment

PHASE 25 --- Final Presentation Story

PROBLEM
Software has an invisible environmental cost.

        ↓

DETECTION
GreenOps identifies potentially inefficient code.

        ↓

INTELLIGENCE
AI explains the problem and proposes an optimization.

        ↓

MEASUREMENT
We execute the workload and collect runtime telemetry.

        ↓

ENERGY
We estimate energy consumption.

        ↓

CARBON
We convert energy into operational CO₂e.

        ↓

VERIFICATION
We compare the original and optimized versions.

        ↓

RESULT
We prove whether the optimization actually helped.

Final Product Statement

GreenOps AI turns software sustainability from an invisible concern
into a measurable engineering metric.

Final Differentiator

AI proposes. Measurement verifies.

Recommended Execution Order

PHASE 1
Project Setup
       ↓
PHASE 2
Backend + DB
       ↓
PHASE 3
Frontend Foundation
       ↓
PHASE 4
Static Analyzer
       ↓
PHASE 5
Runtime Profiler
       ↓
PHASE 6
Energy Engine
       ↓
PHASE 7
Carbon Engine
       ↓
PHASE 8
AI Agent
       ↓
PHASE 9
Verification
       ↓
PHASE 10
Green Score
       ↓
PHASE 11
End-to-End Integration
       ↓
PHASE 12–13
UI + Visualization
       ↓
PHASE 14–15
GitHub PR Integration
       ↓
PHASE 16–18
Testing + Accuracy + Security
       ↓
PHASE 19–21
Reliability + Deployment + Demo Data
       ↓
PHASE 22
FINAL DEMO
       ↓
PHASE 23–25
JUDGE PREPARATION

Critical Priority Order

If time becomes limited:

P0 --- Must Work

Code
 ↓
Static Detection
 ↓
AI Optimization
 ↓
Benchmark Before/After
 ↓
Energy Estimation
 ↓
CO₂e
 ↓
Verification

P1 --- Strongly Recommended

Green Score
Before/After dashboard
Docker sandbox

P2 --- Add If Time Allows

GitHub PR integration
GitHub OAuth
Live carbon-intensity API

P3 --- Future

VS Code extension
GPU optimization
Cloud integration
Kubernetes
Autonomous optimization
Enterprise dashboard

Definition of Done

GreenOps AI is MVP complete when a judge can watch this entire flow
without manual intervention:

1. Developer submits inefficient code
              ↓
2. GreenOps identifies a sustainability hotspot
              ↓
3. AI explains the problem
              ↓
4. AI generates an optimization
              ↓
5. GreenOps executes both versions
              ↓
6. Runtime metrics are collected
              ↓
7. Energy is estimated
              ↓
8. CO₂e is calculated
              ↓
9. Before/after results are shown
              ↓
10. Optimization is verified
              ↓
11. Green Score is updated

GreenOps doesn't just tell developers to write greener code. It
gives them evidence that a change actually made the software more
efficient.