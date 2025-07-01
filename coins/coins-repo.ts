// coin_repo.ts

// Импортируем необходимые типы данных из ваших моделей.
// Предполагается, что эти пути разрешаются через ваш importMap.
import { Coin } from "#models/coin.ts";
import { CoinType } from "#models/coin-type.ts";
import { Dominant } from "#models/dominant.ts";

// Импортируем статический класс ServantsConfigOperator для получения конфигурации API.
// Предполагается, что этот путь разрешается через ваш importMap.
import { ServantsConfigOperator } from "#global/servant-config.ts";

// Импортируем утилиты для сжатия и распаковки.
// Предполагается, что эти функции доступны по указанному пути.
// Если у вас нет этих функций, вам нужно будет их реализовать или импортировать из соответствующей библиотеки.
import {
  compressToGzipBase64Async,
  decompressFromGzipBase64Async,
} from "#shared/utils/compression-utils.ts"; // <-- Убедитесь, что этот путь верен

/**
 * Интерфейс, описывающий ожидаемую структуру ответа от API монет.
 * Основано на использовании `binanceCoins` и `bybitCoins` в исходном коде.
 */
interface CoinsApiResponse {
  binanceCoins: Coin[];
  bybitCoins: Coin[];
  // Добавьте другие свойства, если API возвращает их
}

/**
 * Простая реализация кэша для демонстрации.
 * Используется для имитации кэширования с поддержкой TTL.
 */
class ServantConfigCache<K, V> {
  // Изменен тип V на более общий, так как теперь он может хранить { data: string }
  private cache = new Map<K, V>();
  private stdTTL: number; // Стандартное время жизни (Time To Live) для элементов кэша

  constructor(options: { stdTTL: number }) {
    this.stdTTL = options.stdTTL; // Для простоты, TTL здесь не полностью реализован, но свойство присутствует.
  }

  /**
   * Устанавливает значение в кэш по заданному ключу.
   * @param key Ключ, по которому будет храниться значение.
   * @param value Значение, которое нужно сохранить.
   */
  set(key: K, value: V): void {
    this.cache.set(key, value);
  }

  /**
   * Возвращает значение из кэша по заданному ключу.
   * @param key Ключ значения.
   * @returns Значение, связанное с ключом, или `undefined`, если ключ не найден.
   */
  get(key: K): V | undefined {
    return this.cache.get(key);
  }
}

/**
 * Класс `BinanceDominantCache` управляет различными кэшами для доминирующих монет.
 * Он содержит отдельные экземпляры `ServantConfigCache` для различных типов монет
 * и бирж (Binance, Bybit, Spot, Perps).
 */
class BinanceDominantCache {
  // Кэши для Binance
  public binancePerp: ServantConfigCache<string, { data: string }>;
  public binanceSpot: ServantConfigCache<string, { data: string }>;
  // Кэши для Bybit (предполагается, что они также существуют, исходя из логики сжатия/распаковки)
  public bybitPerp: ServantConfigCache<string, { data: string }>;
  public bybitSpot: ServantConfigCache<string, { data: string }>;

  constructor() {
    this.binancePerp = new ServantConfigCache({ stdTTL: 0 });
    this.binanceSpot = new ServantConfigCache({ stdTTL: 0 });
    this.bybitPerp = new ServantConfigCache({ stdTTL: 0 });
    this.bybitSpot = new ServantConfigCache({ stdTTL: 0 });
  }
}

/**
 * `CoinRepo` - это статический класс, предназначенный для управления
 * операциями, связанными с монетами, такими как получение данных из API,
 * их сжатие, кэширование и последующая распаковка.
 *
 * Он обеспечивает централизованный и типобезопасный способ взаимодействия
 * с данными о монетах в приложении.
 */
export class CoinRepo {
  // Приватное статическое свойство для отслеживания, был ли репозиторий инициализирован.
  private static _initialized: boolean = false;
  // Приватный статический экземпляр класса кэша для хранения данных о монетах.
  private static binanceDominantCache: BinanceDominantCache;

  // Статический блок инициализации, который выполняется один раз при загрузке класса.
  // Здесь мы инициализируем наш экземпляр `BinanceDominantCache`.
  static {
    CoinRepo.binanceDominantCache = new BinanceDominantCache();
  }

  /**
   * Инициализирует репозиторий монет, загружая и кэшируя данные.
   * Этот метод должен быть вызван один раз при запуске приложения,
   * прежде чем будут использоваться другие методы `CoinRepo`.
   * Он получает данные из API, сжимает их и сохраняет в кэше.
   *
   * @returns {Promise<void>} Промис, который разрешается после успешной инициализации.
   * @throws {Error} Если инициализация не удалась (например, из-за проблем с API или сжатием).
   */
  public static async initialize(): Promise<void> {
    // Проверяем, был ли репозиторий уже инициализирован, чтобы избежать повторной инициализации.
    if (CoinRepo._initialized) {
      console.log(
        "🔵 CoinRepo уже инициализирован. Пропускаем повторную инициализацию."
      );
      return;
    }

    try {
      console.log("🔵 CoinRepo → инициализация...");

      // 1. Получаем все необходимые данные из БД параллельно через API.
      // Используем `this.fetchDominantCoins` для вызова статического метода внутри класса.
      const [binanceDominantPerpsResponse, binanceDominantSpotResponse] =
        await Promise.all([
          this.fetchDominantCoins("Binance", "perp"),
          this.fetchDominantCoins("Binance", "spot"),
        ]);

      // 2. Сжимаем все данные параллельно для эффективности.
      // Используем свойства `binanceCoins` и `bybitCoins` из ответов API.
      const [
        compressedBinanceDominantPerpsBinanceCoins,
        compressedBinanceDominantPerpsBybitCoins,
        compressedBinanceDominantSpotBinanceCoins,
        compressedBinanceDominantSpotBybitCoins,
      ] = await Promise.all([
        compressToGzipBase64Async(binanceDominantPerpsResponse.binanceCoins),
        compressToGzipBase64Async(binanceDominantPerpsResponse.bybitCoins),
        compressToGzipBase64Async(binanceDominantSpotResponse.binanceCoins),
        compressToGzipBase64Async(binanceDominantSpotResponse.bybitCoins),
      ]);

      // 3. Сохраняем сжатые данные в кэш.
      // Каждый кэш хранит объект `{ data: string }`, где `data` - это сжатая строка.
      this.binanceDominantCache.binancePerp.set("coins", {
        data: compressedBinanceDominantPerpsBinanceCoins,
      });
      this.binanceDominantCache.bybitPerp.set("coins", {
        data: compressedBinanceDominantPerpsBybitCoins,
      });
      this.binanceDominantCache.binanceSpot.set("coins", {
        data: compressedBinanceDominantSpotBinanceCoins,
      });
      this.binanceDominantCache.bybitSpot.set("coins", {
        data: compressedBinanceDominantSpotBybitCoins,
      });

      CoinRepo._initialized = true; // Устанавливаем флаг инициализации в true.
      console.log("✅ CoinRepo → инициализирован...");
    } catch (error) {
      console.error("❌ Ошибка при инициализации CoinRepo:", error);
      // Перебрасываем ошибку, чтобы вызывающий код мог ее обработать.
      throw error;
    }
  }

  /**
   * Получает отсортированные доминирующие монеты из базы данных через API.
   * Этот метод использует конфигурацию `coinsApi` из `ServantsConfigOperator`.
   *
   * @param dominant Тип доминирования (например, 'Binance', 'Bybit').
   * @param coinType Тип монеты (например, 'perp', 'spot').
   * @returns {Promise<CoinsApiResponse>} Промис, который разрешается объектом с массивами `Coin`.
   * @throws {Error} Если репозиторий не инициализирован, отсутствует конфигурация `coinsApi`,
   * или запрос к API монет не удался.
   */
  public static async fetchDominantCoins(
    dominant: Dominant,
    coinType: CoinType
  ): Promise<CoinsApiResponse> {
    // Получаем конфигурацию приложения из ServantsConfigOperator.
    // Если ServantsConfigOperator не был инициализирован, этот вызов выбросит ошибку.
    const config = ServantsConfigOperator.getConfig();

    // Проверяем наличие необходимой конфигурации API.
    if (!config?.coinsApi) {
      throw new Error(
        "Отсутствует конфигурация 'coinsApi' в ServantsConfigOperator. Пожалуйста, проверьте переменные окружения."
      );
    }

    // Формируем URL для запроса к API монет.
    const url = `${config.coinsApi}/api/coins/sorted?dominant=${dominant}&coinType=${coinType}`;
    try {
      // Выполняем HTTP-запрос.
      const response = await fetch(url);

      // Проверяем статус ответа. Если он не OK (например, 4xx или 5xx), выбрасываем ошибку.
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Запрос к API монет не удался: Статус ${response.status} - ${errorText}`
        );
      }

      // Парсим JSON-ответ и возвращаем его.
      // Приводим тип к `CoinsApiResponse`, предполагая, что API возвращает эту структуру.
      return (await response.json()) as CoinsApiResponse;
    } catch (error) {
      console.error("❌ Ошибка при инициализации CoinRepo:", error);
      // Перебрасываем ошибку, чтобы вызывающий код мог ее обработать.
      throw error;
    }
  }

  /**
   * Вспомогательная приватная функция для безопасной распаковки данных из кэша.
   * Она принимает элемент кэша (который содержит сжатую строку) и пытается его распаковать.
   *
   * @param cacheItem Элемент, полученный из кэша, ожидается `{ data: string } | undefined`.
   * @returns {Promise<T | null>} Промис, который разрешается распакованными данными типа `T`
   * или `null`, если распаковка не удалась или данные отсутствуют.
   */
  private static async _decompressCacheItem<T>(
    cacheItem: { data: string } | undefined
  ): Promise<T | null> {
    // Проверяем, что у нас есть объект с данными и что `data` является строкой.
    if (!cacheItem?.data || typeof cacheItem.data !== "string") {
      return null;
    }
    try {
      // Распаковываем строку с помощью асинхронной функции.
      return await decompressFromGzipBase64Async<T>(cacheItem.data);
    } catch (error) {
      console.error("❌ Не удалось распаковать элемент кэша:", error);
      return null;
    }
  }

  /**
   * Получает и распаковывает данные о монетах из кэша.
   * Этот метод возвращает данные для Binance и Bybit, для Spot и Perps.
   *
   * @returns {Promise<{ binancePerps: Coin[] | null; binanceSpot: Coin[] | null; bybitPerps: Coin[] | null; bybitSpot: Coin[] | null; }>}
   * Промис, который разрешается объектом, содержащим массивы `Coin[]` или `null` для каждого типа.
   * @throws {Error} Если репозиторий не инициализирован.
   */
  public static async getCoinsFromCache(): Promise<{
    binancePerps: Coin[] | null;
    binanceSpot: Coin[] | null;
    bybitPerps: Coin[] | null;
    bybitSpot: Coin[] | null;
  }> {
    // Проверяем, был ли репозиторий инициализирован перед получением данных из кэша.
    if (!CoinRepo._initialized) {
      throw new Error(
        "CoinRepo не инициализирован. Вызовите статический метод initialize() сначала."
      );
    }

    // Параллельно распаковываем данные из всех соответствующих кэшей.
    // Используем приватный метод `_decompressCacheItem` для обработки распаковки.
    const [binancePerps, bybitPerps, binanceSpot, bybitSpot] =
      await Promise.all([
        this._decompressCacheItem<Coin[]>(
          this.binanceDominantCache.binancePerp.get("coins")
        ),
        this._decompressCacheItem<Coin[]>(
          this.binanceDominantCache.bybitPerp.get("coins")
        ),
        this._decompressCacheItem<Coin[]>(
          this.binanceDominantCache.binanceSpot.get("coins")
        ),
        this._decompressCacheItem<Coin[]>(
          this.binanceDominantCache.bybitSpot.get("coins")
        ),
      ]);

    // Возвращаем объект со всеми распакованными данными.
    return { binancePerps, binanceSpot, bybitPerps, bybitSpot };
  }
}
