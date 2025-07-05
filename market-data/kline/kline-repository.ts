import { Redis } from "redis";
import { ServantsConfigOperator } from "#global/servant-config.ts";
import { TF } from "#models/timeframes.ts";
import { MarketData } from "#models/market-data.ts";
import { KlineStatsData } from "#kline/models/market-stats.ts";
import { VwapStatsData } from "#kline/models/vwap-stats.ts";
import { VwapActionData } from "#kline/models/vwap-action.ts";
import { PriceActionStatsData } from "#kline/models/price-action-stats.ts";
import { PriceActionData } from "#kline/models/price-action.ts";
import { HmaStatsData } from "#kline/models/hma-stats.ts";
import { HmaActionData } from "#kline/models/hma-action.ts";
import {
  compressToGzipBase64Async,
  decompressFromGzipBase64Async,
} from "#shared/utils/compression-utils.ts";
import { TIMEFRAME_CONFIG } from "#kline/config/timeframe-config.ts";
import { fetchKlineData } from "#kline/functions/fetches/fetch-kline-data.ts";

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

  private static getVwapActionKey(timeframe: TF): string {
    return `vwapAction:${timeframe}`;
  }

  private static getPriceActionStatsKey(timeframe: TF): string {
    return `priceStats:${timeframe}`;
  }

  private static getPriceActionKey(timeframe: TF): string {
    return `priceAction:${timeframe}`;
  }

  private static getHmaStatsKey(timeframe: TF): string {
    return `hmaStats:${timeframe}`;
  }

  private static getHmaActionKey(timeframe: TF): string {
    return `hmaAction:${timeframe}`;
  }

  /**
   * Сохраняет все сущности атомарно.
   */
  public static async set(
    timeframe: TF,
    marketData: MarketData,
    klineStatsData: KlineStatsData,
    vwapStatsData: VwapStatsData,
    priceActionStatsData?: PriceActionStatsData,
    priceActionData?: PriceActionData,
    hmaStatsData?: HmaStatsData,
    hmaActionData?: HmaActionData,
    vwapActionData?: VwapActionData
  ): Promise<void> {
    if (!this.redis) this.initializeRedis();

    const compressedMarket = await compressToGzipBase64Async(marketData);
    const compressedKlineStats = await compressToGzipBase64Async(
      klineStatsData
    );
    const compressedVwapStats = await compressToGzipBase64Async(vwapStatsData);

    const pipeline: Record<string, string> = {
      [this.getMarketKey(timeframe)]: compressedMarket,
      [this.getStatsKey(timeframe)]: compressedKlineStats,
      [this.getVwapStatsKey(timeframe)]: compressedVwapStats,
    };

    if (priceActionStatsData) {
      const compressedPriceActionStats = await compressToGzipBase64Async(
        priceActionStatsData
      );
      pipeline[this.getPriceActionStatsKey(timeframe)] =
        compressedPriceActionStats;
    }

    if (priceActionData) {
      const compressedPriceActionData = await compressToGzipBase64Async(
        priceActionData
      );
      pipeline[this.getPriceActionKey(timeframe)] = compressedPriceActionData;
    }

    if (hmaStatsData) {
      const compressedHmaStats = await compressToGzipBase64Async(hmaStatsData);
      pipeline[this.getHmaStatsKey(timeframe)] = compressedHmaStats;
    }

    if (hmaActionData) {
      const compressedHmaAction = await compressToGzipBase64Async(
        hmaActionData
      );
      pipeline[this.getHmaActionKey(timeframe)] = compressedHmaAction;
    }

    if (vwapActionData) {
      const compressedVwapAction = await compressToGzipBase64Async(
        vwapActionData
      );
      pipeline[this.getVwapActionKey(timeframe)] = compressedVwapAction;
    }

    await this.redis!.mset(pipeline);

    const savedParts: string[] = [
      "🌟 marketData",
      "🔥 klineStatsData",
      "💜 vwapStatsData",
    ];

    if (priceActionStatsData) savedParts.push("🌟priceActionStatsData");
    if (priceActionData) savedParts.push("🎯 priceActionData");
    if (hmaStatsData) savedParts.push("⚡ hmaStatsData");
    if (hmaActionData) savedParts.push("🏹 hmaActionData");
    if (vwapActionData) savedParts.push("🌀 vwapActionData");

    console.log(
      `🈯️ [KlineRepo] Saved for ${timeframe}:\n` +
        savedParts.map((part) => `   ├─ ${part}`).join("\n")
    );
  }

  /** Получает MarketData */
  public static async getMarket(timeframe: TF): Promise<MarketData | null> {
    if (!this.redis) this.initializeRedis();
    const compressed = await this.redis!.get<string>(
      this.getMarketKey(timeframe)
    );
    if (!compressed) return null;
    return decompressFromGzipBase64Async<MarketData>(compressed);
  }

  /** Получает KlineStatsData */
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

  /** Получает VwapStatsData */
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

  /** Получает VwapActionData */
  public static async getVwapAction(
    timeframe: TF
  ): Promise<VwapActionData | null> {
    if (!this.redis) this.initializeRedis();
    const compressed = await this.redis!.get<string>(
      this.getVwapActionKey(timeframe)
    );
    if (!compressed) return null;
    return decompressFromGzipBase64Async<VwapActionData>(compressed);
  }

  /** Получает PriceActionStatsData */
  public static async getPriceActionStats(
    timeframe: TF
  ): Promise<PriceActionStatsData | null> {
    if (!this.redis) this.initializeRedis();
    const compressed = await this.redis!.get<string>(
      this.getPriceActionStatsKey(timeframe)
    );
    if (!compressed) return null;
    return decompressFromGzipBase64Async<PriceActionStatsData>(compressed);
  }

  /** Получает PriceActionData */
  public static async getPriceAction(
    timeframe: TF
  ): Promise<PriceActionData | null> {
    if (!this.redis) this.initializeRedis();
    const compressed = await this.redis!.get<string>(
      this.getPriceActionKey(timeframe)
    );
    if (!compressed) return null;
    return decompressFromGzipBase64Async<PriceActionData>(compressed);
  }

  /** Получает HmaStatsData */
  public static async getHmaStats(timeframe: TF): Promise<HmaStatsData | null> {
    if (!this.redis) this.initializeRedis();
    const compressed = await this.redis!.get<string>(
      this.getHmaStatsKey(timeframe)
    );
    if (!compressed) return null;
    return decompressFromGzipBase64Async<HmaStatsData>(compressed);
  }

  /** Получает HmaActionData */
  public static async getHmaAction(
    timeframe: TF
  ): Promise<HmaActionData | null> {
    if (!this.redis) this.initializeRedis();
    const compressed = await this.redis!.get<string>(
      this.getHmaActionKey(timeframe)
    );
    if (!compressed) return null;
    return decompressFromGzipBase64Async<HmaActionData>(compressed);
  }
  /**
   * Загружает и сохраняет все таймфреймы из конфига.
   */
  public static async initialize(limit: number): Promise<void> {
    this.initializeRedis();

    for (const tfKey of Object.keys(TIMEFRAME_CONFIG) as TF[]) {
      console.log(`✨ [KlineRepo] Fetching data for timeframe: ${tfKey}`);

      const {
        marketData,
        klineStatsData,
        vwapStatsData,
        vwapActionData,
        priceActionStatsData,
        priceActionData,
        hmaStatsData,
        hmaActionData,
      } = await fetchKlineData(tfKey, limit);

      await this.set(
        tfKey,
        marketData,
        klineStatsData,
        vwapStatsData,
        priceActionStatsData,
        priceActionData,
        hmaStatsData,
        hmaActionData,
        vwapActionData
      );

      const details: string[] = ["🤟 Market", "💙 KlineStats", "⚡️ VwapStats"];

      if (priceActionStatsData) details.push("🌟 PriceActionStats");
      if (priceActionData) details.push("🎯 PriceAction");
      if (hmaStatsData) details.push("⚡ HmaStats");
      if (hmaActionData) details.push("🏹 HmaAction");
      if (vwapActionData) details.push("🌀 VwapAction");

      console.log(
        `🈯️ [KlineRepo] Saved ${tfKey}:\n` +
          details.map((item) => `   ├─ ${item}`).join("\n")
      );
    }

    console.log("🈯️ [KlineRepo] Initialization completed");
  }
  /**
   * Загружает и обновляет данные по конкретному таймфрейму.
   */
  public static async fetchFreshData(
    timeframe: TF,
    limit: number
  ): Promise<void> {
    this.initializeRedis();

    console.log(
      `⏳ [KlineRepo] Refreshing data for timeframe: ${timeframe} ...`
    );

    const {
      marketData,
      klineStatsData,
      vwapStatsData,
      vwapActionData,
      priceActionStatsData,
      priceActionData,
      hmaStatsData,
      hmaActionData,
    } = await fetchKlineData(timeframe, limit);

    await this.set(
      timeframe,
      marketData,
      klineStatsData,
      vwapStatsData,
      priceActionStatsData,
      priceActionData,
      hmaStatsData,
      hmaActionData,
      vwapActionData
    );

    console.log(`
🈯️ [KlineRepo] Refreshed data for ${timeframe}
  ├─ Market ............ ✅
  ├─ KlineStats ........ ✅
  ├─ VwapStats ......... ✅
  ├─ PriceActionStats .. ${priceActionStatsData ? "✅" : "❌"}
  ├─ PriceAction ....... ${priceActionData ? "✅" : "❌"}
  ├─ HmaStats .......... ${hmaStatsData ? "✅" : "❌"}
  ├─ HmaAction ......... ${hmaActionData ? "✅" : "❌"}
  └─ VwapAction ........ ${vwapActionData ? "✅" : "❌"}
`);
  }
}
