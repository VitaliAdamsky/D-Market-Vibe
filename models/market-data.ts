import { FundingRateData } from "./fr.ts";
import { KlineData } from "../market-data/kline/models/kline.ts";
import { OpentInterestData } from "./oi.ts";

export interface MarketData {
  timeframe: string;
  expirationTime: number;
  projectName: string;
  dataType: string;
  data: FundingRateData[] | KlineData[] | OpentInterestData[];
}
