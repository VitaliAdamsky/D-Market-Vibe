const {
  getServantConfig,
} = require("@global/servants/servant-config/service.js");

async function addFailedCoinsToCache(exchange, coinType, failedCoins) {
  const config = getServantConfig();

  // Build query string with all three params
  const query = new URLSearchParams({
    exchange,
    coinType,
  });

  const url = `${config.coinsApi}/api/coins/failed-add?${query.toString()}`;
  console.log("FailedUrl", url);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(failedCoins),
    });

    if (!response.ok) {
      console.error(
        `Failed to add failed coins to cache: ${response.statusText}`
      );
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error adding failed coins to cache:", error);
    throw error;
  }
}

module.exports = { addFailedCoinsToCache };
