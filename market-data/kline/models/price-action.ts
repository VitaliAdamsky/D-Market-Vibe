export interface PriceAction {
  openTime: number;
  closeTime: number;
  pinbars: string[];
  hammbers: string[];
  dojis: string[];
  bearsihEngulfings: string[];
  bullishEngulfings: string[];
}

export interface PriceActionData {
  projectName: string;
  timeframe: string;
  expirationTime: number;
  data: PriceAction[];
}
