import { TF } from "#models/timeframes.ts";

export interface KlineStatsItem {
  openTime: number;
  closeTime: number;
  bullshCandles: number;
  rollingVwap?: number;
  rollingVwapUBand?: number;
  rollingVwapLBand?: number;
  aboveUBand?: number;
  belowLBand?: number;
  insideBands?: number;
  crossUBandUp?: number;
  crossLBandUp?: number;
  crossUBandDown?: number;
  crossLBandDown?: number;
  crossVwapUp?: number;
  crossVwapDown?: number;
}

export interface KlineStatsData {
  totalCoins: number;
  projectName: string;
  timeframe: TF;
  expirationTime: number;
  data: KlineStatsItem[];
}
