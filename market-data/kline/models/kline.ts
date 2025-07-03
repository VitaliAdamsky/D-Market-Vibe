export interface KlineDataItem {
  openTime: number;
  closeTime: number;
  highPrice: number;
  lowPrice: number;
  openPrice: number;
  closePrice: number;
  quoteVolume: number;
  buyerRatio?: number;
  volumeDelta?: number;
  quoteVolumeChange?: number;
  volumeDeltaChange?: number;
  closePriceChange?: number;
  buyerRatioChange?: number;
  spotClosePrice?: number;
  perpSpotDiff?: number;
  // Добавляем эти новые нормализованные поля
  normalizedClosePrice?: number;
  normalizedBuyerRatio?: number;
  normalizedQuoteVolume?: number;
  normalizedVolumeDelta?: number;

  rollingVwap?: number;
  rollingVwapUBand?: number;
  rollingVwapLBand?: number;

  colors?: {
    closePrice: string;
    closePriceChange: string;
    buyerRatio?: string;
    buyerRatioChange?: string;
    quoteVolume: string;
    quoteVolumeChange: string;
    spotClosePrice?: string;
    perpSpotDiff?: string;
    volumeDelta?: string;
    volumeDeltaChange?: string;
  };
}

export interface KlineData {
  symbol: string;
  exchanges: string[];
  imageUrl: string;
  category: string;
  data: KlineDataItem[];
}
