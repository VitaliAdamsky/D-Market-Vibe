export interface HmaStatsItem {
  openTime: number;
  closeTime: number;
  bullishCandle: number;
  aboveHma: number;
  belowHma: number;
  crossHmaUp: number;
  crossHmaDown: number;
}

export interface HmaStatsData {
  projectName: string;
  timeframe: string;
  expirationTime: number;
  data: HmaStatsItem[];
}
