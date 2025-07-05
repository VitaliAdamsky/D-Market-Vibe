import { Hono } from "hono";
import { TF } from "#models/timeframes.ts";
import { KlineRepo } from "#kline/kline-repository.ts";

const marketRouter = new Hono();

/**
 * Валидация таймфрейма
 */
function validateTF(tfParam: string): TF | null {
  return Object.values(TF).includes(tfParam as TF) ? (tfParam as TF) : null;
}

/**
 * GET /kline/:timeframe/market
 * MarketData
 */
marketRouter.get("/:timeframe/kline-action", async (c) => {
  const tf = validateTF(c.req.param("timeframe"));
  if (!tf) return c.json({ error: "Invalid timeframe" }, 400);

  const data = await KlineRepo.getMarket(tf);
  if (!data) return c.json({ error: "No market data found" }, 404);

  return c.json(data);
});

/**
 * GET /kline/:timeframe/kline-stats
 * KlineStatsData
 */
marketRouter.get("/:timeframe/kline-stats", async (c) => {
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
marketRouter.get("/:timeframe/vwap-stats", async (c) => {
  const tf = validateTF(c.req.param("timeframe"));
  if (!tf) return c.json({ error: "Invalid timeframe" }, 400);

  const data = await KlineRepo.getVwapStats(tf);
  if (!data) return c.json({ error: "No VWAP stats found" }, 404);

  return c.json(data);
});

/**
 * GET /kline/:timeframe/vwap-action
 * VwapActionData
 */
marketRouter.get("/:timeframe/vwap-action", async (c) => {
  const tf = validateTF(c.req.param("timeframe"));
  if (!tf) return c.json({ error: "Invalid timeframe" }, 400);

  const data = await KlineRepo.getVwapAction(tf);
  if (!data) return c.json({ error: "No VWAP action data found" }, 404);

  return c.json(data);
});

/**
 * GET /kline/:timeframe/price-action-stats
 * PriceActionStatsData
 */
marketRouter.get("/:timeframe/price-action-stats", async (c) => {
  const tf = validateTF(c.req.param("timeframe"));
  if (!tf) return c.json({ error: "Invalid timeframe" }, 400);

  const data = await KlineRepo.getPriceActionStats(tf);
  if (!data) return c.json({ error: "No price action stats found" }, 404);

  return c.json(data);
});

/**
 * GET /kline/:timeframe/price-action
 * PriceActionData
 */
marketRouter.get("/:timeframe/price-action", async (c) => {
  const tf = validateTF(c.req.param("timeframe"));
  if (!tf) return c.json({ error: "Invalid timeframe" }, 400);

  const data = await KlineRepo.getPriceAction(tf);
  if (!data) return c.json({ error: "No price action data found" }, 404);

  return c.json(data);
});

/**
 * GET /kline/:timeframe/hma-stats
 * HmaStatsData
 */
marketRouter.get("/:timeframe/hma-stats", async (c) => {
  const tf = validateTF(c.req.param("timeframe"));
  if (!tf) return c.json({ error: "Invalid timeframe" }, 400);

  const data = await KlineRepo.getHmaStats(tf);
  if (!data) return c.json({ error: "No HMA stats found" }, 404);

  return c.json(data);
});

/**
 * GET /kline/:timeframe/hma-action
 * HmaActionData
 */
marketRouter.get("/:timeframe/hma-action", async (c) => {
  const tf = validateTF(c.req.param("timeframe"));
  if (!tf) return c.json({ error: "Invalid timeframe" }, 400);

  const data = await KlineRepo.getHmaAction(tf);
  if (!data) return c.json({ error: "No HMA action data found" }, 404);

  return c.json(data);
});

/**
 * GET /kline/:timeframe/all
 * Возвращает все данные сразу
 */
marketRouter.get("/:timeframe/all", async (c) => {
  const tf = validateTF(c.req.param("timeframe"));
  if (!tf) return c.json({ error: "Invalid timeframe" }, 400);

  const [
    marketData,
    klineStatsData,
    vwapStatsData,
    vwapActionData,
    priceActionStatsData,
    priceActionData,
    hmaStatsData,
    hmaActionData,
  ] = await Promise.all([
    KlineRepo.getMarket(tf),
    KlineRepo.getKlineStats(tf),
    KlineRepo.getVwapStats(tf),
    KlineRepo.getVwapAction(tf),
    KlineRepo.getPriceActionStats(tf),
    KlineRepo.getPriceAction(tf),
    KlineRepo.getHmaStats(tf),
    KlineRepo.getHmaAction(tf),
  ]);

  if (
    !marketData &&
    !klineStatsData &&
    !vwapStatsData &&
    !vwapActionData &&
    !priceActionStatsData &&
    !priceActionData &&
    !hmaStatsData &&
    !hmaActionData
  ) {
    return c.json({ error: "No data found for timeframe" }, 404);
  }

  return c.json({
    marketData,
    klineStatsData,
    vwapStatsData,
    vwapActionData,
    priceActionStatsData,
    priceActionData,
    hmaStatsData,
    hmaActionData,
  });
});

export default marketRouter;

// http://localhost:3000/api/market/1h/kline-action OK
// http://localhost:3000/api/market/1h/kline-stats OK
// http://localhost:3000/api/market/1h/vwap-stats NOT OK
// http://localhost:3000/api/market/1h/vwap-action OK
// http://localhost:3000/api/market/4h/price-action-stats OK
// http://localhost:3000/api/market/4h/price-action OK
// http://localhost:3000/api/market/4h/hma-stats OK
// http://localhost:3000/api/market/4h/hma-action OK
