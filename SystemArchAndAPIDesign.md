# GreenOps AI — System Architecture + API Specification

## 1. Architecture Overview

GreenOps AI is designed as a modular system with five major layers:

```text
┌──────────────────────────────────────────────────────────┐
│                    DEVELOPER                             │
│                                                          │
│        Web Dashboard / VS Code / GitHub PR               │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│                     API BACKEND                          │
│                                                          │
│  Authentication │ Projects │ Analysis │ PR │ Results     │
└───────────────┬──────────────┬──────────────┬────────────┘
                │              │              │
                ▼              ▼              ▼
        ┌────────────┐  ┌────────────┐  ┌──────────────┐
        │ Code       │  │ Runtime    │  │ AI Agent     │
        │ Analyzer   │  │ Profiler   │  │              │
        └─────┬──────┘  └─────┬──────┘  └──────┬───────┘
              │               │                 │
              └───────────────┼─────────────────┘
                              ▼
                    ┌──────────────────┐
                    │ Energy Engine    │
                    └────────┬─────────┘
                             ▼
                    ┌──────────────────┐
                    │ Carbon Engine    │
                    └────────┬─────────┘
                             ▼
                    ┌──────────────────┐
                    │ Verification     │
                    │ Engine            │
                    └────────┬─────────┘
                             ▼
                    ┌──────────────────┐
                    │ PostgreSQL       │
                    └──────────────────┘
```

---

# 2. Frontend

## Recommended Stack

* React
* TypeScript
* Vite
* Tailwind CSS
* Recharts
* Monaco Editor

## Responsibilities

The frontend provides:

* Code input
* Repository/PR selection
* Analysis results
* Energy metrics
* CO₂e metrics
* Green Score
* AI recommendations
* Before/after comparison
* Verification status
* Project history

---

# 3. Main UI Pages

## Dashboard

Shows:

```text
Green Score
Energy consumption
CO₂e
Recent analyses
Recent PRs
Energy improvements
```

## Code Analysis

Developer can:

1. Paste/upload code
2. Select language
3. Run analysis
4. View detected hotspots
5. Request optimization

## Analysis Result

Example:

```text
Green Score: 74

Potential Hotspots
────────────────────────────

⚠ N+1 Database Query
⚠ O(n²) Algorithm
⚠ Repeated API Call

Estimated Energy
0.076 Wh

Estimated CO₂e
0.046 g
```

## Before / After

```text
                 BEFORE       AFTER

Runtime           2.4s        0.8s
CPU               82%         39%
Energy            0.061 Wh    0.020 Wh
CO₂e              0.043 g     0.014 g

Energy Reduction             67%
```

---

# 4. Backend

## Recommended Stack

**Go** or **Node.js + TypeScript**

For the hackathon, Node.js + TypeScript is simpler if the team wants rapid development.

Recommended:

```text
Node.js
TypeScript
Fastify / Express
PostgreSQL
Prisma
```

The backend acts as the central orchestrator.

## Responsibilities

* Authentication
* Project management
* Code analysis requests
* Analysis orchestration
* Benchmark execution
* Runtime telemetry collection
* Energy estimation
* Carbon calculation
* AI orchestration
* Verification
* GitHub integration
* Persisting results

---

# 5. Backend Modules

```text
backend/
│
├── auth/
├── projects/
├── analysis/
├── code-analyzer/
├── runtime-profiler/
├── energy-engine/
├── carbon-engine/
├── ai-agent/
├── verification/
├── github/
└── reports/
```

### Auth Module

Handles:

* Login
* Registration
* Sessions/tokens
* User authorization

### Analysis Module

Creates and tracks analysis jobs.

### Code Analyzer

Performs static analysis.

### Runtime Profiler

Runs workloads and collects runtime telemetry.

### Energy Engine

Converts runtime telemetry into estimated energy consumption.

### Carbon Engine

Converts energy consumption into estimated operational CO₂e.

### AI Agent

Explains problems and proposes optimizations.

### Verification Engine

Compares original vs optimized implementations.

### GitHub Module

Handles:

* Repository connection
* PR retrieval
* Changed files
* PR comments

---

# 6. Database

## PostgreSQL

Recommended because GreenOps has relational data:

```text
Users
Projects
Repositories
Analyses
CodeFindings
Benchmarks
RuntimeMetrics
EnergyMeasurements
CarbonMeasurements
Optimizations
VerificationResults
```

---

# 7. Simplified Database Schema

## users

```text
id
name
email
created_at
```

## projects

```text
id
user_id
name
repository_url
language
created_at
```

## analyses

```text
id
project_id
type
status
commit_sha
created_at
completed_at
```

Possible `type`:

```text
CODE
PR
BENCHMARK
```

## code_findings

```text
id
analysis_id
file
line_start
line_end
category
severity
description
suggestion
```

## runtime_metrics

```text
id
analysis_id
execution_time
cpu_usage
cpu_time
memory_usage
network_bytes
api_calls
db_queries
```

## energy_measurements

```text
id
analysis_id
estimated_power
energy_wh
estimation_method
confidence
```

## carbon_measurements

```text
id
energy_measurement_id
carbon_intensity
carbon_emissions_g
region
```

## optimizations

```text
id
analysis_id
original_code
optimized_code
ai_explanation
status
```

## verification_results

```text
id
optimization_id
before_energy
after_energy
before_carbon
after_carbon
energy_reduction_percent
carbon_reduction_percent
status
```

---

# 8. Authentication

For the MVP:

### Option 1 — GitHub OAuth

Recommended if GreenOps focuses on GitHub PRs.

```text
Developer
   ↓
Login with GitHub
   ↓
GitHub OAuth
   ↓
GreenOps
   ↓
Authenticated session
```

Benefits:

* Easy repository access
* Natural GitHub workflow
* No need to create a separate password system

### Option 2 — Email/password

Can be used for the standalone dashboard.

For the hackathon, GitHub OAuth is sufficient if the main demo is PR-based.

---

# 9. Code Analyzer

The Code Analyzer has two responsibilities.

### Static analysis

Detect patterns such as:

```text
O(n²) algorithms
N+1 database queries
Repeated API calls
Unnecessary loops
Redundant computation
Excessive allocations
```

### AI-assisted analysis

The LLM receives:

```text
Relevant code
+
Static analysis findings
+
Programming language
+
Context
```

and produces structured findings.

Example:

```json
{
  "category": "N+1_QUERY",
  "severity": "HIGH",
  "explanation": "Database query executed inside a loop.",
  "recommendation": "Batch the queries."
}
```

---

# 10. Runtime Profiler

The Runtime Profiler executes the workload in a controlled environment.

```text
Code
 ↓
Sandbox / Container
 ↓
Execute benchmark
 ↓
Collect telemetry
```

Collect:

```text
CPU utilization
CPU time
Execution time
Memory
Network I/O
API calls
Database queries
```

For AI workloads:

```text
GPU utilization
GPU memory
```

can be added.

---

# 11. Sandbox

User code should **not execute directly on the backend server**.

Use an isolated execution environment.

Recommended:

```text
Docker Container
```

Each benchmark gets an isolated container.

Example:

```text
Benchmark Job
      ↓
Docker Container
      ↓
Execute code
      ↓
Collect metrics
      ↓
Destroy container
```

This is important for both security and reproducibility.

---

# 12. Energy Estimation Engine

The Energy Engine receives runtime telemetry:

```text
CPU
Memory
Runtime
GPU
Hardware profile
```

and estimates energy.

Core relationship:

```text
Energy (Wh) =
Estimated Power (W) × Runtime (hours)
```

The system should distinguish:

```text
Measured
Estimated
Predicted
```

For the MVP:

```text
Runtime telemetry
       ↓
Hardware power model
       ↓
Estimated Power
       ↓
Energy (Wh)
```

---

# 13. Carbon Engine

The Carbon Engine converts energy into operational CO₂e.

```text
Energy (kWh)
      ×
Carbon Intensity
      ↓
Operational CO₂e
```

Example:

```text
Energy:
0.00005 kWh

Carbon intensity:
600 gCO₂e/kWh

CO₂e:
0.03 g
```

The result should store:

```text
energy_kwh
carbon_intensity
region
carbon_emissions
timestamp
```

This allows the system to explain where the carbon estimate came from.

---

# 14. AI Agent Architecture

Instead of one generic AI call, use a simple agent workflow.

```text
                 AI ORCHESTRATOR
                        │
        ┌───────────────┼────────────────┐
        ↓               ↓                ↓
   Analyzer Agent   Optimizer Agent   Explainer
        │               │                │
        ↓               ↓                ↓
     Findings       New Code          Explanation
                        │
                        ▼
                 Verification
```

## Analyzer Agent

Identifies potential inefficiencies.

## Optimizer Agent

Generates an improved implementation.

## Explainer Agent

Explains:

* What changed
* Why it may improve efficiency
* What resources could be affected

The AI does **not** determine the final carbon reduction.

---

# 15. Verification Engine

This is the most important component.

The verification engine compares:

```text
BASE
  vs
OPTIMIZED
```

Both are executed using the same:

* Input
* Environment
* Benchmark
* Number of runs

Then:

```text
Runtime
CPU
Memory
Network
Energy
CO₂e
```

are compared.

Example:

```text
Before Energy: 0.061 Wh
After Energy:  0.020 Wh

Reduction: 67%

Before CO₂e: 0.043 g
After CO₂e:  0.014 g

Reduction: 67%

Status: VERIFIED
```

If energy increases:

```text
Status: REJECTED
```

This prevents generic AI recommendations from being presented as verified sustainability improvements.

---

# 16. Green Score Engine

The Green Score provides a simple developer-facing metric.

Example:

```text
Green Score: 86 / 100
```

Potential dimensions:

```text
Energy Efficiency
Compute Efficiency
Memory Efficiency
Network Efficiency
Carbon Efficiency
```

The exact weighting should remain configurable during the MVP.

---

# 17. GitHub Integration

The GitHub integration is responsible for:

```text
Repository
    ↓
Pull Request
    ↓
Changed files
    ↓
GreenOps analysis
    ↓
Benchmark
    ↓
Energy / CO₂e comparison
    ↓
PR comment
```

Example PR comment:

```text
🌱 GreenOps Sustainability Report

Green Score: 74

Energy Impact: +18%
CO₂e Impact:   +17%

⚠ Sustainability Regression

Potential causes:
• Increased API calls
• Increased DB queries
• Higher CPU time

[View GreenOps Analysis]
```

---

# 18. External APIs / Services

## Required

### AI Model API

Used for:

* Code reasoning
* Optimization
* Explanation

The model provider should be configurable.

```text
AI_PROVIDER=...
AI_MODEL=...
AI_API_KEY=...
```

### GitHub API

Used for:

* Repository access
* Pull requests
* Changed files
* PR comments

---

## Optional

### Carbon Intensity API

Used to retrieve regional electricity carbon intensity.

The architecture should keep this behind a `CarbonIntensityProvider` interface so we can change providers without changing the rest of the system.

```text
Carbon Engine
      ↓
CarbonIntensityProvider
      ↓
External Carbon API
```

If the API is unavailable, the MVP can use a configured regional emission factor and clearly label it as an estimate.

---

# 19. Development Tools / Packages

## Frontend

```text
React
TypeScript
Vite
Tailwind CSS
Recharts
Monaco Editor
Axios / Fetch
```

## Backend

```text
Node.js
TypeScript
Fastify / Express
Prisma
PostgreSQL
Zod
```

## Runtime

```text
Docker
Node.js / Python runtime
OS-level resource monitoring
```

## AI

```text
LLM API
Structured JSON output
Prompt templates
```

## GitHub

```text
GitHub REST API
GitHub Webhooks
GitHub App / OAuth
```

## Testing

```text
Vitest / Jest
Supertest
Postman
```

---

# 20. Complete Data Flow — Code Analysis

```text
Developer
    │
    ▼
Frontend
    │
    │ POST /api/analyses
    ▼
Backend
    │
    ▼
Code Analyzer
    │
    ├── Static Analysis
    │
    └── AI Analysis
            │
            ▼
        Findings
            │
            ▼
        Database
            │
            ▼
        Frontend
```

---

# 21. Complete Data Flow — Verification

```text
Developer
    │
    ▼
Select Optimization
    │
    ▼
Backend
    │
    ├──────────────┐
    ▼              ▼
BASE CODE      OPTIMIZED CODE
    │              │
    ▼              ▼
Benchmark       Benchmark
    │              │
    ▼              ▼
Runtime         Runtime
Profiler        Profiler
    │              │
    └───────┬──────┘
            ▼
      Energy Engine
            │
            ▼
      Carbon Engine
            │
            ▼
     Verification Engine
            │
            ▼
       Before / After
            │
            ▼
       Green Score
            │
            ▼
         Frontend
```

---

# 22. Complete Data Flow — GitHub PR

```text
Developer
    │
    ▼
Create Pull Request
    │
    ▼
GitHub Webhook
    │
    ▼
GreenOps Backend
    │
    ▼
Fetch PR Diff
    │
    ▼
Static Code Analysis
    │
    ▼
Identify affected workload
    │
    ▼
Run benchmark
    │
    ▼
Collect telemetry
    │
    ▼
Estimate Energy
    │
    ▼
Calculate CO₂e
    │
    ▼
Compare Base vs PR
    │
    ▼
AI Explanation
    │
    ▼
GitHub PR Comment
```

---

# 23. API Specification

## Authentication

### `GET /api/auth/github`

Start GitHub OAuth.

### `GET /api/auth/github/callback`

Handle GitHub OAuth callback.

### `POST /api/auth/logout`

Logout the current user.

---

# Projects

### `POST /api/projects`

Create a project.

Request:

```json
{
  "name": "Payment Service",
  "repositoryUrl": "https://github.com/example/payment-service"
}
```

Response:

```json
{
  "id": "project_123",
  "name": "Payment Service"
}
```

### `GET /api/projects`

Get user's projects.

### `GET /api/projects/:projectId`

Get project details.

### `DELETE /api/projects/:projectId`

Delete project.

---

# Code Analysis

### `POST /api/analyses`

Create a code analysis.

Request:

```json
{
  "projectId": "project_123",
  "language": "python",
  "code": "..."
}
```

Response:

```json
{
  "analysisId": "analysis_123",
  "status": "QUEUED"
}
```

### `GET /api/analyses/:analysisId`

Get analysis status and results.

Response:

```json
{
  "id": "analysis_123",
  "status": "COMPLETED",
  "greenScore": 74,
  "findings": []
}
```

---

# Benchmark

### `POST /api/benchmarks`

Start a benchmark.

Request:

```json
{
  "analysisId": "analysis_123",
  "codeVersion": "BASE"
}
```

Response:

```json
{
  "benchmarkId": "benchmark_123",
  "status": "QUEUED"
}
```

### `GET /api/benchmarks/:benchmarkId`

Get benchmark results.

Response:

```json
{
  "executionTime": 2.41,
  "cpuUsage": 82,
  "memoryMb": 184,
  "networkBytes": 204800
}
```

---

# Optimization

### `POST /api/optimizations`

Ask AI to generate an optimization.

Request:

```json
{
  "analysisId": "analysis_123",
  "findingId": "finding_456"
}
```

Response:

```json
{
  "optimizationId": "optimization_123",
  "status": "GENERATED",
  "explanation": "...",
  "optimizedCode": "..."
}
```

---

# Verification

### `POST /api/verifications`

Verify an optimization.

Request:

```json
{
  "optimizationId": "optimization_123"
}
```

Response:

```json
{
  "status": "VERIFIED",
  "energyReductionPercent": 67.2,
  "carbonReductionPercent": 66.8
}
```

---

# GitHub

### `POST /api/github/connect`

Connect a GitHub repository.

### `GET /api/github/repos`

List accessible repositories.

### `GET /api/github/repos/:owner/:repo/pulls`

List pull requests.

### `POST /api/github/webhook`

Receive GitHub PR events.

### `POST /api/github/pulls/:pullNumber/analyze`

Start GreenOps analysis for a PR.

---

# 24. API Communication Pattern

For simple operations:

```text
Frontend
   ↓
REST API
   ↓
Backend
   ↓
Database
```

For long-running operations:

```text
Frontend
   ↓
POST /api/analyses
   ↓
Backend
   ↓
Background Job
   ↓
Analyzer / Profiler
   ↓
Database
   ↓
Frontend polls result
```

For the hackathon MVP, **we can use a simple job queue or even an in-memory job manager** rather than introducing Kafka or other unnecessary infrastructure.

---

# 25. Recommended MVP Architecture

Do NOT build a huge microservice architecture.

Use a modular monolith:

```text
                 React
                   │
                   ▼
             Node.js API
                   │
        ┌──────────┼──────────┐
        ↓          ↓          ↓
      Code       Runtime      AI
    Analyzer     Profiler    Agent
        │          │          │
        └──────────┼──────────┘
                   ↓
             Energy Engine
                   ↓
             Carbon Engine
                   ↓
           Verification Engine
                   │
                   ▼
              PostgreSQL
```

And:

```text
GitHub ───────→ Node.js API
                    │
                    ▼
                 Docker
                    │
                    ▼
              Benchmark Runner
```

This keeps the system simple enough to build, debug and explain during judging.

---

# 26. MVP Technology Stack

| Layer           | Technology                      |
| --------------- | ------------------------------- |
| Frontend        | React + TypeScript + Vite       |
| Styling         | Tailwind CSS                    |
| Code Editor     | Monaco Editor                   |
| Charts          | Recharts                        |
| Backend         | Node.js + TypeScript            |
| API             | Fastify / Express               |
| Database        | PostgreSQL                      |
| ORM             | Prisma                          |
| AI              | Configurable LLM API            |
| Code Execution  | Docker                          |
| Git Integration | GitHub API                      |
| PR Events       | GitHub Webhooks                 |
| Energy          | Runtime telemetry + power model |
| Carbon          | Carbon-intensity provider       |
| Testing         | Vitest/Jest + Postman           |
| Deployment      | Docker + cloud hosting          |

---

# 27. What We Should NOT Build Yet

Avoid:

```text
❌ Kubernetes
❌ Kafka
❌ Redis
❌ Microservices
❌ Multiple databases
❌ Complex ML models
❌ Custom hardware
❌ Physical power meters
❌ Full cloud infrastructure optimizer
```

These add complexity without improving the core hackathon demo.

The goal is:

> **One complete, believable measurement → optimization → verification pipeline.**

---

# 28. Final Architecture Principle

The entire GreenOps system can be summarized as:

```text
             DETECT
               ↓
             EXPLAIN
               ↓
            OPTIMIZE
               ↓
            EXECUTE
               ↓
            MEASURE
               ↓
          ENERGY → CO₂e
               ↓
            VERIFY
               ↓
             SCORE
```

### The most important components are:

**Code Analyzer** → finds potential problems

**AI Agent** → proposes solutions

**Runtime Profiler** → collects evidence

**Energy Engine** → estimates energy

**Carbon Engine** → calculates operational CO₂e

**Verification Engine** → proves whether the optimization worked

**GitHub Integration** → brings everything into the developer's PR workflow

> **AI proposes. Measurement verifies. GreenOps makes the result visible where developers already work.**
