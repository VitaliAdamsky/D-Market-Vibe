const { calcChange } = require("@shared/calculations/calculate-change.js");

function mergeSpotWithPerps(perps, spot) {
  if (!Array.isArray(perps)) {
    throw new Error("Expected 'perps' to be an array");
  }
  if (!Array.isArray(spot)) {
    throw new Error("Expected 'spot' to be an array");
  }

  // Build spotMap[symbol][openTime] = closePrice
  const spotMap = new Map();
  for (const { symbol, data } of spot) {
    if (!Array.isArray(data)) continue;
    const timeMap = new Map();
    for (const entry of data) {
      timeMap.set(entry.openTime, entry.closePrice);
    }
    spotMap.set(symbol, timeMap);
  }

  // Process perps
  return perps.map((perp) => {
    const { symbol, data, ...meta } = perp;
    if (!Array.isArray(data)) return { symbol, ...meta, data: [] };

    const spotData = spotMap.get(symbol);
    let prev = null;

    const processed = data.map((entry) => {
      const spotClosePrice = spotData?.get(entry.openTime) ?? null;
      const perpSpotDiff =
        spotClosePrice !== null
          ? calcChange(entry.closePrice, spotClosePrice)
          : null;

      const changes = {
        quoteVolumeChange: calcChange(entry.quoteVolume, prev?.quoteVolume),
        volumeDeltaChange: calcChange(entry.volumeDelta, prev?.volumeDelta),
        closePriceChange: calcChange(entry.closePrice, prev?.closePrice),
        buyerRatioChange: calcChange(entry.buyerRatio, prev?.buyerRatio),
      };

      prev = entry;

      return {
        ...entry,
        ...changes,
        spotClosePrice,
        perpSpotDiff,
      };
    });

    return {
      symbol,
      ...meta,
      data: processed.slice(1),
    };
  });
}

module.exports = { mergeSpotWithPerps };
