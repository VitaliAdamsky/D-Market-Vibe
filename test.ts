import { CoinRepo } from "#coins/coins-repo.ts";
import { ServantsConfigOperator } from "#global/servant-config.ts";

await ServantsConfigOperator.initialize();
const config = ServantsConfigOperator.getConfig();
await CoinRepo.initialize();

const cachedCoins = await CoinRepo.getCoinsFromCache();
console.log(
  "Полученные монеты из кэша (Binance Perps, первые 3):",
  cachedCoins.binancePerps?.slice(0, 3)
);
console.log(
  "Полученные монеты из кэша (Binance Spot, первые 3):",
  cachedCoins.binanceSpot?.slice(0, 3)
);
console.log(
  "Полученные монеты из кэша (Bybit Perps, первые 3):",
  cachedCoins.bybitPerps?.slice(0, 3)
);
console.log(
  "Полученные монеты из кэша (Bybit Spot, первые 3):",
  cachedCoins.bybitSpot?.slice(0, 3)
);
