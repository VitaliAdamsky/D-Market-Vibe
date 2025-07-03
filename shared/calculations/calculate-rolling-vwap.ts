import { TF } from "#models/timeframes.ts";
import { KlineData, KlineDataItem } from "#kline/models/kline.ts";

/**
 * Рассчитывает Rolling VWAP с полосами отклонений для массива KlineData по заданному таймфрейму.
 * Добавляет в каждый KlineDataItem поля rollingVwap, rollingVwapUBand, rollingVwapLBand
 * @param klineData - данные по свечам
 * @param timeframe - таймфрейм (для определения окна)
 * @param minBars - минимальное число свечей в окне (по умолчанию 10)
 * @returns новый объект KlineData с добавленными вычислениями
 */
export function calculateRollingVwap(
  klineDataArray: KlineData[],
  timeframe: TF,
  minBars = 10
): KlineData[] {
  return klineDataArray.map((klineData) =>
    doRollingVwapCalculations(klineData, timeframe, minBars)
  );
}

/**
 * Исходная функция для расчёта Rolling VWAP по одному KlineData
 */
export function doRollingVwapCalculations(
  klineData: KlineData,
  timeframe: TF,
  minBars = 10
): KlineData {
  const timeWindowMs = getTimeWindowMsForTimeframe(timeframe);

  const dataWithVwap: KlineDataItem[] = klineData.data.map((item) => ({
    ...item,
  }));

  if (
    dataWithVwap.length > 0 &&
    (dataWithVwap[0].highPrice === undefined ||
      dataWithVwap[0].lowPrice === undefined)
  ) {
    console.error(
      "Для расчёта VWAP нужны highPrice и lowPrice в данных KlineDataItem"
    );
    return { ...klineData, data: dataWithVwap };
  }

  for (let i = 0; i < dataWithVwap.length; i++) {
    const currentBar = dataWithVwap[i];
    const decimalPlaces = countDecimalPlaces(currentBar.closePrice);

    const windowStartTime = currentBar.openTime - timeWindowMs;

    const window: KlineDataItem[] = [];
    for (let j = i; j >= 0; j--) {
      const pastBar = dataWithVwap[j];
      if (pastBar.openTime >= windowStartTime) {
        window.unshift(pastBar);
      } else {
        if (window.length < minBars) {
          window.unshift(pastBar);
        } else {
          break;
        }
      }
    }

    if (window.length === 0) continue;

    let sumSrcVol = 0;
    let sumVol = 0;
    let sumSrcSrcVol = 0;

    for (const bar of window) {
      const hlc3 = (bar.highPrice + bar.lowPrice + bar.closePrice) / 3;
      sumVol += bar.quoteVolume;
      sumSrcVol += hlc3 * bar.quoteVolume;
      sumSrcSrcVol += bar.quoteVolume * hlc3 * hlc3;
    }

    if (sumVol === 0) continue;

    let rollingVwap = sumSrcVol / sumVol;
    const variance = Math.max(
      0,
      sumSrcSrcVol / sumVol - rollingVwap * rollingVwap
    );
    let stDev = Math.sqrt(variance);

    // Округляем значения по количеству знаков closePrice
    rollingVwap = parseFloat(rollingVwap.toFixed(decimalPlaces));
    stDev = parseFloat(stDev.toFixed(decimalPlaces));

    dataWithVwap[i].rollingVwap = rollingVwap;
    dataWithVwap[i].rollingVwapUBand = parseFloat(
      (rollingVwap + stDev).toFixed(decimalPlaces)
    );
    dataWithVwap[i].rollingVwapLBand = parseFloat(
      (rollingVwap - stDev).toFixed(decimalPlaces)
    );
  }

  return { ...klineData, data: dataWithVwap };
}

/**
 * Вспомогательная функция определения окна в мс для таймфрейма
 */
function getTimeWindowMsForTimeframe(timeframe: TF): number {
  const MS_IN_MIN = 60 * 1000;
  const MS_IN_HOUR = 60 * MS_IN_MIN;
  const MS_IN_DAY = 24 * MS_IN_HOUR;

  switch (timeframe) {
    case TF.h1:
      return MS_IN_DAY;
    case TF.h4:
      return MS_IN_DAY * 3;
    case TF.h12:
      return MS_IN_DAY * 7;
    case TF.D:
      return MS_IN_DAY * 30;
    default:
      return MS_IN_DAY;
  }
}

/**
 * Функция для подсчёта количества знаков после запятой у числа
 */
function countDecimalPlaces(value: number): number {
  if (Math.floor(value) === value || !isFinite(value)) return 0;
  const valueStr = value.toString();
  const decimalPart = valueStr.split(".")[1];
  return decimalPart ? decimalPart.length : 0;
}
