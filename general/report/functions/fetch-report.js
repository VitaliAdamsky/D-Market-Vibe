function fetchReport() {
  const symbol = "10000BABYDOGEUSDT";
  const klineData = [];

  for (let i = 0; i < 1; i++) {
    // Generate random prices between 0.001 and 0.002
    const openPrice = Math.random() * (0.002 - 0.001) + 0.001;
    const closePrice = Math.random() * (0.002 - 0.001) + 0.001;
    const highPrice = Math.max(openPrice, closePrice) + Math.random() * 0.0005;
    const lowPrice = Math.min(openPrice, closePrice) - Math.random() * 0.0005;

    // Generate random volumes
    const baseVolume = Math.random() * (5000000 - 4000000) + 4000000;
    const quoteVolume = Math.random() * (20000000 - 10000000) + 10000000;

    klineData.push({
      symbol,
      openPrice: parseFloat(openPrice.toFixed(6)),
      closePrice: parseFloat(closePrice.toFixed(6)),
      highPrice: parseFloat(highPrice.toFixed(6)),
      lowPrice: parseFloat(lowPrice.toFixed(6)),
      baseVolume: Math.round(baseVolume),
      quoteVolume: Math.round(quoteVolume),
    });
  }

  return klineData;
}

module.exports = { fetchReport };
