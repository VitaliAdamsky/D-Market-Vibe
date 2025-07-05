export interface PriceActionStatsItem {
  openTime: number;
  closeTime: number;
  bullishCandles: number;
  pinbars: number;
  hammbers: number;
  dojis: number;
  bearsihEngulfings: number;
  bullishEngulfings: number;
}

export interface PriceActionStatsData {
  totalCoins: number;
  projectName: string;
  timeframe: string;
  expirationTime: number;
  data: PriceActionStatsItem[];
}
