const { getColorsCache } = require("@general/colors/cache/service.js");

const {
  getGradientColorForPositiveRange,
} = require("@general/colors/functions/normalization/get-gradient-color-for-positive-range.js");

const {
  getColorFromChangeValue,
} = require("@general/colors/functions/normalization/get-color-from-change-value.js");

const { getPercentile } = require("@shared/normalization/get-percentile.js");

const MIN_PERCENTILE = 1;
const MAX_PERCENTILE = 99;

function normalizeOpenInterestData(marketDataArray) {
  const colors = getColorsCache();

  return marketDataArray.map((coinData) => {
    const data = coinData.data;

    if (!data.length) return coinData;

    // Extract values
    const openInterests = data.map((item) => item.openInterest ?? 0);
    const openInterestChanges = data.map(
      (item) => item.openInterestChange ?? 0
    );

    // Percentile-based min-max scaling
    const minOI = getPercentile(openInterests, MIN_PERCENTILE);
    const maxOI = getPercentile(openInterests, MAX_PERCENTILE);
    const oiRange = maxOI - minOI || 1;

    const minOIChange = getPercentile(openInterestChanges, MIN_PERCENTILE);
    const maxOIChange = getPercentile(openInterestChanges, MAX_PERCENTILE);
    const oiChangeRange = maxOIChange - minOIChange || 1;

    const updatedData = data.map((item) => {
      const gamma = 0.5;

      const openInterest = item.openInterest ?? 0;
      const openInterestChange = item.openInterestChange ?? 0;

      const clippedOI = Math.max(minOI, Math.min(openInterest, maxOI));
      const clippedOIChange = Math.max(
        minOIChange,
        Math.min(openInterestChange, maxOIChange)
      );

      const normalizedOI = Math.pow((clippedOI - minOI) / oiRange, gamma);

      const normalizedOIChange =
        (clippedOIChange - minOIChange) / oiChangeRange;
      const scaledOIChange = (normalizedOIChange - 0.5) * 2; // scale to [-1, 1]

      const oiColor = getGradientColorForPositiveRange(
        normalizedOI,
        colors.openInterestMin,
        colors.openInterestMax
      );

      const oiChangeColor = getColorFromChangeValue(
        scaledOIChange,
        -1,
        1,
        colors.openInterestChangeMin,
        colors.openInterestChangeMax
      );

      return {
        ...item,
        normalizedOpenInterest: Number(normalizedOI.toFixed(2)),
        normalizedOpenInterestChange: Number(scaledOIChange.toFixed(2)),
        colors: {
          ...(item.colors || {}),
          openInterest: oiColor,
          openInterestChange: oiChangeColor,
        },
      };
    });

    return {
      ...coinData,
      data: updatedData,
    };
  });
}

module.exports = { normalizeOpenInterestData };
