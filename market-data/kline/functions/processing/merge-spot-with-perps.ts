import { SpotKlineData } from "#kline/models/spot.ts";
import { calcChange } from "#shared/calculations/calculate-change.ts";
import { KlineData, KlineDataItem } from "#kline/models/kline.ts";

/**
 * Объединяет данные фьючерсов с данными спота, добавляя расчетные поля.
 * @param perps - Массив успешных результатов от `fetchBybitPerpKlines`.
 * @param spot - Массив успешных результатов от `fetchBybitSpotKlines`.
 * @returns Массив объединенных данных по каждой монете.
 */
/**
 * Объединяет данные фьючерсов с данными спота, добавляя расчетные поля.
 * @param perps - Массив успешных результатов от `fetchBybitPerpKlines`.
 * @param spot - Массив успешных результатов от `fetchBybitSpotKlines`.
 * @returns Массив объединенных данных по каждой монете.
 */
/**
 * Объединяет данные по спотовым и фьючерсным свечам, добавляя поля
 * spotClosePrice и perpSpotDiff, а также рассчитывает изменения по объёмам и ценам.
 *
 * @param perps - массив MarketData с фьючерсными данными
 * @param spot - массив MarketData со спотовыми данными
 * @returns объединённый массив MarketData с расширенными KlineDataItem
 */
export function mergeSpotWithPerps(
  perps: KlineData[],
  spot: SpotKlineData[]
): KlineData[] {
  if (!Array.isArray(perps)) {
    throw new Error("Expected 'perps' to be an array");
  }
  if (!Array.isArray(spot)) {
    throw new Error("Expected 'spot' to be an array");
  }

  // Создаем Map<symbol, Map<openTime, closePrice>>
  const spotMap = new Map<string, Map<number, number>>();

  for (const spotResult of spot) {
    const symbol = spotResult.symbol; // исправлено, т.к. у SpotKlineData есть symbol
    const data = spotResult.data;

    if (!Array.isArray(data)) continue;

    const timeMap = new Map<number, number>();
    for (const entry of data) {
      timeMap.set(entry.openTime, entry.closePrice);
    }
    spotMap.set(symbol, timeMap);
  }

  return perps.map((perpResult): KlineData => {
    const { symbol, data, ...meta } = perpResult;

    if (!Array.isArray(data)) {
      return {
        symbol,
        ...meta,
        data: [],
      };
    }

    const spotDataForSymbol = spotMap.get(symbol);
    let prev: KlineDataItem | null = null;

    const processedData: KlineDataItem[] = data.map((entry) => {
      const spotClosePrice = spotDataForSymbol?.get(entry.openTime);

      const perpSpotDiff =
        spotClosePrice !== undefined
          ? calcChange(entry.closePrice, spotClosePrice)
          : 0;

      const quoteVolumeChange = prev
        ? calcChange(entry.quoteVolume, prev.quoteVolume)
        : 0;
      const closePriceChange = prev
        ? calcChange(entry.closePrice, prev.closePrice)
        : 0;
      const volumeDeltaChange = prev
        ? calcChange(entry.volumeDelta ?? 0, prev.volumeDelta ?? 0)
        : 0;
      const buyerRatioChange = prev
        ? calcChange(entry.buyerRatio ?? 0, prev.buyerRatio ?? 0)
        : 0;

      prev = entry;

      return {
        openTime: entry.openTime,
        closeTime: entry.closeTime,
        highPrice: entry.highPrice,
        lowPrice: entry.lowPrice,
        closePrice: entry.closePrice,
        quoteVolume: entry.quoteVolume,
        buyerRatio: entry.buyerRatio,
        volumeDelta: entry.volumeDelta,
        spotClosePrice,
        perpSpotDiff,
        quoteVolumeChange,
        closePriceChange,
        volumeDeltaChange,
        buyerRatioChange,
      };
    });

    return {
      symbol,
      ...meta,
      data: processedData.slice(1), // отбрасываем первую свечу как в оригинале
    };
  });
}
