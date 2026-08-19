/**
 * GreenOps AI - Phase 7: Carbon Intensity Provider Abstraction
 * 
 * Core Principle: AI proposes. Measurement verifies.
 * Provides carbon intensity metrics in g CO2e / kWh by region.
 * Designed to support static/configured MVP data and seamless future
 * integration with live APIs (e.g., Electricity Maps, WattTime, Cloud Carbon Footprint).
 */

export interface CarbonIntensityProvider {
  /**
   * Retrieves the current carbon intensity for a specified region.
   * @param region Cloud or grid region (e.g. 'us-east-1', 'eu-west-1', 'global')
   * @returns Carbon intensity in g CO2e / kWh
   */
  getCurrentIntensity(region?: string): Promise<number> | number;

  /**
   * Retrieves historical or timestamp-specific carbon intensity.
   * @param timestamp Date or ISO string
   * @param region Cloud or grid region
   * @returns Carbon intensity in g CO2e / kWh
   */
  getIntensity(timestamp: string | Date, region?: string): Promise<number> | number;
}

// Preset regional carbon intensity factors (in g CO2e / kWh)
// Source: Real-world grid emission factor averages (EIA, Ember, Cloud Carbon Footprint)
export const DEFAULT_CARBON_INTENSITIES: Record<string, number> = {
  "global": 475.0,        // World average grid intensity
  "us-east-1": 385.0,     // AWS N. Virginia (PJM Grid)
  "us-west-2": 150.0,     // AWS Oregon (Pacific NW Hydro heavy)
  "eu-west-1": 210.0,     // AWS Ireland
  "eu-central-1": 338.0,  // AWS Frankfurt
  "ap-south-1": 708.0,    // AWS Mumbai (India Grid)
  "sa-east-1": 110.0      // AWS São Paulo (Hydro heavy)
};

export class StaticCarbonIntensityProvider implements CarbonIntensityProvider {
  private intensities: Record<string, number>;
  private defaultRegion: string;

  constructor(customIntensities?: Record<string, number>, defaultRegion: string = "global") {
    this.intensities = { ...DEFAULT_CARBON_INTENSITIES, ...customIntensities };
    this.defaultRegion = defaultRegion.toLowerCase();
  }

  public getCurrentIntensity(region?: string): number {
    const targetRegion = (region || this.defaultRegion).toLowerCase();
    const intensity = this.intensities[targetRegion];

    if (typeof intensity === "number" && !isNaN(intensity) && intensity >= 0) {
      return intensity;
    }

    // Fallback to global intensity if specific region is unmapped
    return this.intensities["global"] ?? 475.0;
  }

  public getIntensity(_timestamp: string | Date, region?: string): number {
    // Static provider returns regional intensity regardless of timestamp.
    // Live API providers will override this to query historical time-series data.
    return this.getCurrentIntensity(region);
  }
}

export const staticCarbonProvider = new StaticCarbonIntensityProvider();
