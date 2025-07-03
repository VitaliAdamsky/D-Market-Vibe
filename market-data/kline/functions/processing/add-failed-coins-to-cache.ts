import { Coin } from "#models/coin.ts";
import { CoinType } from "#models/coin-type.ts";
import { ServantsConfigOperator } from "#global/servant-config.ts";

export async function addFailedCoinsToCache(
  exchange = "Binance",
  coinType: CoinType,
  failedCoins: Coin[]
) {
  const config = ServantsConfigOperator.getConfig();
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
