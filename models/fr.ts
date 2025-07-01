export interface FundingRateItem {
  openTime: number;
  closeTime: number;
  fundingRate: number;
  fundingRateChange: number | null;
  colors?: {
    fundingRate: string;
    fundingRateChange: string;
  };
}

export interface FundingRateData {
  symbol: string;
  exchanges: string[];
  imageUrl: string;
  category: string;
  data: FundingRateItem[];
}
