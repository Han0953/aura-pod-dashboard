/**
 * MRV (Monitoring, Reporting, Verification) Types matching agent.md/documentation/DATA_MODEL.md
 */

export interface CarbonMetric {
  value: number;
  unit: string;
  estimated: boolean;
  timestamp: string;
  sequestrationDailyKg: number;
  efficiencyPercent: number;
}

export interface BiomassMetric {
  opticalDensity680: number | null;
  dryBiomassDensityGPerL: number | null;
  estimated: boolean;
  timestamp: string;
}
