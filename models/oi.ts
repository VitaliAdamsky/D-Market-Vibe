export interface OpentInterestItem {
  openTime: number;
  symbol: string;
  openInterest: number;
  openInterestChange: number;
  colors: {
    openInterest: string;
    openInterestChange: string;
  };
}

export interface OpentInterestData {
  symbol: string;
  exchanges: string[];
  imageUrl: string;
  category: string;
  data: OpentInterestItem[];
}
