import { Hono } from "hono";
import { TF } from "#models/timeframes.ts";
import { KlineRepo } from "#kline/kline-repository.ts";

const klineRouter = new Hono();

/**
 * Валидация таймфрейма
 */
function validateTF(tfParam: string): TF | null {
  return Object.values(TF).includes(tfParam as TF) ? (tfParam as TF) : null;
}

/**
 * GET /kline/:timeframe
 * MarketData
 */
klineRouter.get("/:timeframe", async (c) => {
  const tf = validateTF(c.req.param("timeframe"));
  if (!tf) return c.json({ error: "Invalid timeframe" }, 400);

  const data = await KlineRepo.getMarket(tf);
  if (!data) return c.json({ error: "No market data found" }, 404);

  return c.json(data);
});

/**
 * GET /kline/:timeframe/stats
 * KlineStatsData
 */
klineRouter.get("/:timeframe/kline-stats", async (c) => {
  const tf = validateTF(c.req.param("timeframe"));
  if (!tf) return c.json({ error: "Invalid timeframe" }, 400);

  const data = await KlineRepo.getKlineStats(tf);
  if (!data) return c.json({ error: "No kline stats found" }, 404);

  return c.json(data);
});

/**
 * GET /kline/:timeframe/vwap-stats
 * VwapStatsData
 */
klineRouter.get("/:timeframe/vwap-stats", async (c) => {
  const tf = validateTF(c.req.param("timeframe"));
  if (!tf) return c.json({ error: "Invalid timeframe" }, 400);

  const data = await KlineRepo.getVwapStats(tf);
  if (!data) return c.json({ error: "No VWAP stats found" }, 404);

  return c.json(data);
});

/**
 * GET /kline/:timeframe/all
 * Возвращает всё: MarketData + KlineStats + VwapStats
 */
klineRouter.get("/:timeframe/all", async (c) => {
  const tf = validateTF(c.req.param("timeframe"));
  if (!tf) return c.json({ error: "Invalid timeframe" }, 400);

  const [marketData, klineStatsData, vwapStatsData] = await Promise.all([
    KlineRepo.getMarket(tf),
    KlineRepo.getKlineStats(tf),
    KlineRepo.getVwapStats(tf),
  ]);

  if (!marketData && !klineStatsData && !vwapStatsData) {
    return c.json({ error: "No data found for timeframe" }, 404);
  }

  return c.json({
    marketData,
    klineStatsData,
    vwapStatsData,
  });
});

export default klineRouter;
