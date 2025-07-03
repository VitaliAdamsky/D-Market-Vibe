import { KlineData } from "#kline/models/kline.ts";

/**
 * Тип для успешного результата (Perpetuals).
 */
export interface FetchSuccessResult {
  success: true;
  data: KlineData;
}

/**
 * Тип для результата с ошибкой.
 */
export interface FetchErrorResult {
  success: false;
  symbol: string;
}

/**
 * Объединенный тип результата (Perpetuals).
 */
export type FetchResult = FetchSuccessResult | FetchErrorResult;
