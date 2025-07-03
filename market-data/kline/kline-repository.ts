import { TF } from "#models/timeframes.ts";
import { MarketData } from "#models/market-data.ts";
import { KlineStatsData } from "#kline/models/market-stats.ts";
import {
  compressToGzipBase64Async,
  decompressFromGzipBase64Async,
} from "#shared/utils/compression-utils.ts";
import { fetchKlineData } from "#kline/functions/fetches/fetch-kline-data.ts";
import { TIMEFRAME_CONFIG } from "#kline/config/timeframe-config.ts";
import { Redis } from "redis";
import { ServantsConfigOperator } from "#global/servant-config.ts";
import { VwapStatsData } from "#kline/models/vwap-stats.ts";

export class KlineRepo {
  private static redis: Redis | null = null;

  public static initializeRedis(): void {
    if (this.redis) return;

    const url = ServantsConfigOperator.getConfig().redisUrl;
    const token = ServantsConfigOperator.getConfig().redisToken;

    if (!url || !token) {
      throw new Error(
        "UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set in environment"
      );
    }

    this.redis = new Redis({ url, token });
  }

  private static getMarketKey(timeframe: TF): string {
    return `kline:${timeframe}`;
  }

  private static getStatsKey(timeframe: TF): string {
    return `klineStats:${timeframe}`;
  }

  private static getVwapStatsKey(timeframe: TF): string {
    return `vwapStats:${timeframe}`;
  }

  /**
   * Сохраняет marketData, klineStatsData и vwapStatsData атомарно
   */
  public static async set(
    timeframe: TF,
    marketData: MarketData,
    klineStatsData: KlineStatsData,
    vwapStatsData: VwapStatsData
  ): Promise<void> {
    if (!this.redis) this.initializeRedis();

    const compressedMarket = await compressToGzipBase64Async(marketData);
    const compressedKlineStats = await compressToGzipBase64Async(
      klineStatsData
    );
    const compressedVwapStats = await compressToGzipBase64Async(vwapStatsData);

    await this.redis!.mset({
      [this.getMarketKey(timeframe)]: compressedMarket,
      [this.getStatsKey(timeframe)]: compressedKlineStats,
      [this.getVwapStatsKey(timeframe)]: compressedVwapStats,
    });

    console.log(
      `✅ [KlineRepo] Saved marketData, klineStatsData, vwapStatsData for ${timeframe}`
    );
  }

  /**
   * Получает только MarketData по таймфрейму
   */
  public static async getMarket(timeframe: TF): Promise<MarketData | null> {
    if (!this.redis) this.initializeRedis();
    const compressed = await this.redis!.get<string>(
      this.getMarketKey(timeframe)
    );
    if (!compressed) return null;
    return decompressFromGzipBase64Async<MarketData>(compressed);
  }

  /**
   * Получает только KlineStatsData по таймфрейму
   */
  public static async getKlineStats(
    timeframe: TF
  ): Promise<KlineStatsData | null> {
    if (!this.redis) this.initializeRedis();
    const compressed = await this.redis!.get<string>(
      this.getStatsKey(timeframe)
    );
    if (!compressed) return null;
    return decompressFromGzipBase64Async<KlineStatsData>(compressed);
  }

  /**
   * Получает только VwapStatsData по таймфрейму
   */
  public static async getVwapStats(
    timeframe: TF
  ): Promise<VwapStatsData | null> {
    if (!this.redis) this.initializeRedis();
    const compressed = await this.redis!.get<string>(
      this.getVwapStatsKey(timeframe)
    );
    if (!compressed) return null;
    return decompressFromGzipBase64Async<VwapStatsData>(compressed);
  }

  /**
   * Загружает и сохраняет все таймфреймы из конфига
   */
  public static async initialize(limit: number): Promise<void> {
    this.initializeRedis();

    for (const tfKey of Object.keys(TIMEFRAME_CONFIG) as TF[]) {
      console.log(`✨ [KlineRepo] Fetching data for timeframe: ${tfKey}`);

      const { marketData, klineStatsData, vwapStatsData } =
        await fetchKlineData(tfKey, limit);

      await this.set(tfKey, marketData, klineStatsData, vwapStatsData);

      console.log(
        `👉 [KlineRepo] Saved ${tfKey} Market, KlineStats, VwapStats`
      );
    }

    console.log("🈯️ [KlineRepo] Initialization completed");
  }
}
