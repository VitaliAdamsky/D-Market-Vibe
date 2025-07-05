export interface VwapAction {
  openTime: number;
  closeTime: number;
  crossUBandUp: string[];
  crossLBandUp: string[];
  crossUBandDown: string[];
  crossLBandDown: string[];
  crossVwapUp: string[];
  crossVwapDown: string[];
  aboveUBand: string[];
  belowLBand: string[];
}

export interface VwapActionData {
  projectName: string;
  timeframe: string;
  expirationTime: number;
  data: VwapAction[];
}
