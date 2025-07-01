import { FundingRateData } from "./fr.ts";
import { KlineData } from "./kline.ts";
import { OpentInterestData } from "./oi.ts";
export interface MarketData {
  timeframe: string;
  expirationTime: number;
  data: FundingRateData[] | KlineData[] | OpentInterestData[];
}
