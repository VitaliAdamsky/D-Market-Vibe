export interface HmaAction {
  openTime: number;
  closeTime: number;
  crossHmaUp: string[];
  crossHmaDown: string[];
}

export interface HmaActionData {
  projectName: string;
  timeframe: string;
  expirationTime: number;
  data: HmaAction[];
}
