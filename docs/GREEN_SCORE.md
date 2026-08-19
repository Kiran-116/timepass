# GreenOps AI — Green Score Methodology Documentation

## Overview

The **Green Score** is a developer-facing product metric (0–100) created by **GreenOps AI** to measure and communicate software workload sustainability and computational resource efficiency.

---

## Important Positioning

> **Green Score is a GreenOps product metric for comparative software benchmarking.**
> 
> * It is **NOT** an official carbon rating or industry standard.
> * It is **NOT** a scientifically universal sustainability claim.
> * It serves as a transparent, explainable, and reproducible decision-support metric for engineering teams.

---

## Evaluated Dimensions

Phase 10 evaluates ONLY dimensions supported by telemetry data actually measured during runtime:

1. **Energy Efficiency (0–100)**: Evaluates estimated energy consumption per execution ($E_{\text{Wh}}$).
2. **Compute Efficiency (0–100)**: Evaluates active CPU usage percentage and execution runtime.
3. **Memory Efficiency (0–100)**: Evaluates peak RAM footprint in MB.
4. **Carbon Efficiency (0–100)**: Evaluates operational emissions ($\text{gCO}_2\text{e}$).

---

## Weighting Matrix & Formula

$$\text{Green Score} = w_{\text{energy}} \cdot S_{\text{energy}} + w_{\text{compute}} \cdot S_{\text{compute}} + w_{\text{memory}} \cdot S_{\text{memory}} + w_{\text{carbon}} \cdot S_{\text{carbon}}$$

* **Default Weights**:
  * Energy Efficiency: **35%** (`0.35`)
  * Compute Efficiency: **25%** (`0.25`)
  * Memory Efficiency: **20%** (`0.20`)
  * Carbon Efficiency: **20%** (`0.20`)

Final composite scores are bounded strictly between **0 and 100**.

---

## Rating Scale

| Green Score Range | Rating | Description |
| :--- | :--- | :--- |
| **90 – 100** | **A+** | Exceptional sustainability and minimal resource consumption |
| **80 – 89** | **A** | High efficiency with minor optimization potential |
| **70 – 79** | **B** | Good / Moderate efficiency |
| **60 – 69** | **C** | Suboptimal resource footprint |
| **50 – 59** | **D** | Inefficient pattern with noticeable energy waste |
| **0 – 49** | **F** | Severe resource bloat & high carbon intensity |

---

## Data Sufficiency & Edge Cases

* **`INSUFFICIENT_DATA`**: Returned when required telemetry/energy metrics are missing or incomplete, preventing fabricated scores.
* **`INVALID_INPUT`**: Returned when input values contain negative numbers, `NaN`, or non-finite values.

---

## Versioning

Current Methodology Version: **`v1.0`**
