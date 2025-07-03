export interface VwapStatsItem {
  aboveUBand: string[];
  belowLBand: string[];
  insideBands: string[];
  crossUBandUp: string[];
  crossLBandUp: string[];
  crossUBandDown: string[];
  crossLBandDown: string[];
  crossVwapUp: string[];
  crossVwapDown: string[];
}

export interface VwapStatsData {
  projectName: string;
  timeframe: string;
  expirationTime: number;
  data: VwapStatsItem[];
}
