// kline-repository.ts

import { KlineData } from "#kline/models/kline.ts";
import { TF } from "#models/timeframes.ts";
import { MarketData } from "#models/market-data.ts";
import {
  compressToGzipBase64Async,
  decompressFromGzipBase64Async,
} from "#shared/utils/compression-utils.ts";
import {
  TIMEFRAME_CONFIG,
  VALID_TIMEFRAMES,
} from "#kline/config/timeframe.config.ts";
import { ServantsConfigOperator } from "#global/servant-config.ts";
import { fetchKlineData } from "./functions/fetches/fetch-kline-data.ts";

// --- Тип для поддерживаемых таймфреймов ---
export type SupportedTF = keyof typeof TIMEFRAME_CONFIG;

function _fetchAllDataForTimeframe(tf: SupportedTF): Promise<KlineData[]> {
  console.log(`⏳ Имитация получения данных для таймфрейма: ${tf}...`);
  return Promise.resolve([
    {
      symbol: `MOCK-${tf}`,
      exchanges: ["mock"],
      imageUrl: "url",
      category: "mock",
      data: [],
    },
  ]);
}

class ServantConfigCache<K, V> {
  private cache = new Map<K, V>();
  private stdTTL: number;

  constructor(options: { stdTTL: number }) {
    this.stdTTL = options.stdTTL;
  }

  set(key: K, value: V): void {
    this.cache.set(key, value);
  }

  get(key: K): V | undefined {
    return this.cache.get(key);
  }
}

class KlineDataCache {
  public caches: Record<
    SupportedTF,
    ServantConfigCache<string, { data: string }>
  >;

  constructor() {
    this.caches = Object.fromEntries(
      Object.entries(TIMEFRAME_CONFIG).map(([tf, config]) => [
        tf,
        new ServantConfigCache<string, { data: string }>({
          stdTTL: config.ttl,
        }),
      ])
    ) as Record<SupportedTF, ServantConfigCache<string, { data: string }>>;
  }
}

export class KlineRepository {
  private static klineDataCache: KlineDataCache = new KlineDataCache();
  private static isInitialized = false;

  public static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn("⚠️ KlineRepository is already initialized.");
      return;
    }

    console.log("🚀 Initializing KlineRepository...");
    try {
      const refreshPromises = VALID_TIMEFRAMES.map(({ timeframe }) =>
        this.refreshCache(timeframe as SupportedTF)
      );
      await Promise.all(refreshPromises);
      this.isInitialized = true;
      console.log("✅ KlineRepository initialized and populated successfully.");
    } catch (error) {
      console.error(
        "❌ Fatal error during KlineRepository initialization:",
        error
      );
    }
  }

  public static async refreshCache(tf: SupportedTF): Promise<void> {
    this.assertTimeframe(tf);
    console.log(`🔄 Refreshing cache for timeframe "${tf}"...`);
    try {
      const freshData = await _fetchAllDataForTimeframe(tf);
      await this.setKlineData(tf, freshData);
    } catch (error) {
      console.error(`❌ Failed to refresh cache for timeframe "${tf}":`, error);
    }
  }

  private static assertTimeframe(tf: SupportedTF): void {
    if (!TIMEFRAME_CONFIG[tf]) {
      throw new Error(
        `❌ Unsupported timeframe "${tf}". Supported: ${Object.keys(
          TIMEFRAME_CONFIG
        ).join(", ")}`
      );
    }
  }

  public static async setKlineData(
    tf: SupportedTF,
    data: MarketData[]
  ): Promise<void> {
    this.assertTimeframe(tf);

    if (!Array.isArray(data)) {
      throw new Error("❌ KLINE CACHE: Data must be an array of KlineData.");
    }

    try {
      const compressedData = await compressToGzipBase64Async(data);
      this.klineDataCache.caches[tf].set("data", { data: compressedData });
      console.log(
        `📦 Compressed kline data for timeframe "${tf}" and stored in cache.`
      );
    } catch (error) {
      console.error(
        `❌ Error compressing or setting kline data for timeframe "${tf}":`,
        error
      );
    }
  }

  public static async getKlineData(
    tf: SupportedTF
  ): Promise<KlineData[] | null> {
    this.assertTimeframe(tf);

    if (!this.isInitialized) {
      console.warn(
        "⚠️ KlineRepository has not been initialized. Cache will be empty."
      );
      return null;
    }

    try {
      const cacheItem = this.klineDataCache.caches[tf].get("data");
      if (!cacheItem?.data) {
        console.log(`🤷 No kline data found in cache for timeframe "${tf}".`);
        return null;
      }

      const decompressedData = await decompressFromGzipBase64Async<KlineData[]>(
        cacheItem.data
      );
      console.log(
        `🛍️ Decompressed and retrieved kline data for timeframe "${tf}" from cache.`
      );
      return decompressedData;
    } catch (error) {
      console.error(
        `❌ Error getting or decompressing kline data for timeframe "${tf}":`,
        error
      );
      return null;
    }
  }

  public static initializeKlineStore(): void {
    for (const config of VALID_TIMEFRAMES) {
      const { timeframe, delay: delayMs } = config;

      console.log(
        `⏱ Kline Store [${timeframe}] will init after ${delayMs / 60000} min`
      );

      setTimeout(async () => {
        try {
          const limit = ServantsConfigOperator.getConfig().limitKline;
          const result = await fetchKlineData(timeframe as TF, limit);
          await this.setKlineData(timeframe as SupportedTF, result);

          console.log(
            `💛 Kline [${timeframe}] Cache initialized | Data size: ${result.data.length}`
          );
        } catch (err) {
          console.error(
            `❌ Kline [${timeframe}] failed to initialize cache:`,
            err instanceof Error ? err.message : err
          );
          if (err instanceof Error && err.stack) console.error(err.stack);
        }
      }, delayMs);
    }
  }
}
