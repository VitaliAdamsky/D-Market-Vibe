// --- Типы для Spot ---

import { FetchErrorResult } from "#kline/models/perp-fetch.ts";

/**
 * Тип для обработанной свечи со спотового рынка.
 */
export interface SpotKlineItem {
  symbol: string;
  openTime: number;
  closePrice: number;
}

export interface SpotKlineData {
  symbol: string;
  category: string;
  exchanges: string[];
  imageUrl: string;
  data: SpotKlineItem[];
}

/**
 * Тип для успешного результата загрузки спотовых данных.
 */
export interface SpotFetchSuccessResult {
  success: true;
  data: SpotKlineData;
}

/**
 * Объединенный тип для результата по спотовым данным.
 */
export type SpotFetchResult = SpotFetchSuccessResult | FetchErrorResult;
