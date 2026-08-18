import { MetricStatistics } from "./types";

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
  }
  return Number(sorted[mid].toFixed(2));
}

export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Number((sum / values.length).toFixed(2));
}

export function calculateMin(values: number[]): number {
  if (values.length === 0) return 0;
  return Number(Math.min(...values).toFixed(2));
}

export function calculateMax(values: number[]): number {
  if (values.length === 0) return 0;
  return Number(Math.max(...values).toFixed(2));
}

export function computeMetricStatistics(values: number[]): MetricStatistics {
  return {
    median: calculateMedian(values),
    average: calculateAverage(values),
    min: calculateMin(values),
    max: calculateMax(values),
  };
}
