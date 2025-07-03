export interface HmaStatsItem {
  openTime: number;
  closeTime: number;
  aboveHma: string[];
  belowHma: string[];
  crossHmaUp: string[];
  crossHmaDown: string[];
}

export interface HmaStatsData {
  projectName: string;
  timeframe: string;
  expirationTime: number;
  data: HmaStatsItem[];
}
