// config_operator.ts

// Импортируем dotenv для загрузки переменных окружения.
// Deno будет использовать importMap для разрешения этого пути.
import { load } from "dotenv/mod.ts"; // <-- Добавлено: Явный импорт функции load
import { DopplerSDK } from "doppler-sdk";
import { AppConfig } from "#models/app-config.ts";

/**
 * Простая реализация кэша для демонстрации.
 * В реальном приложении это может быть более сложная реализация LRUCache
 * или импорт из сторонней библиотеки, как в вашем исходном файле `cache-utils.ts`.
 * Этот класс имитирует базовую функциональность set/get для кэширования конфигурации.
 */
class ServantConfigCache<K, V extends object> {
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
 * `ServantsConfigOperator` - это статический класс, предназначенный для управления
 * конфигурацией приложения. Он загружает секреты из Doppler, кэширует их
 * и предоставляет статические методы для доступа и обновления конфигурации.
 * Это централизованный подход к управлению конфигурацией в Deno-приложении.
 */
const env = await load();
export class ServantsConfigOperator {
  // Приватные статические свойства для хранения состояния и экземпляров.
  // `_initialized` отслеживает, была ли конфигурация успешно инициализирована.
  private static _initialized: boolean = false;
  // `_config` хранит текущую загруженную конфигурацию приложения.
  private static _config: AppConfig | null = null;
  // `_dopplerSdk` хранит экземпляр Doppler SDK для повторного использования.
  private static _dopplerSdk: DopplerSDK | null = null;
  // `_cache` является экземпляром нашего кэша для хранения конфигурации.
  private static _cache: ServantConfigCache<string, AppConfig>;
  // `_envLoaded` флаг, чтобы гарантировать, что переменные окружения загружаются только один раз.
  private static _envLoaded: boolean = false;

  // Статический блок инициализации, который выполняется один раз при загрузке класса.
  // Здесь мы инициализируем наш кэш.
  static {
    ServantsConfigOperator._cache = new ServantConfigCache<string, AppConfig>({
      stdTTL: 0, // Устанавливаем стандартное TTL, 0 означает отсутствие автоматического истечения.
    });
  }

  /**
   * Инициализирует конфигурацию сервисов.
   * Эта функция выполняет следующие шаги:
   * 1. Загружает переменные окружения из файла `.env` (если еще не загружены).
   * 2. Проверяет наличие токена Doppler (`SERVANTS_TOKEN`).
   * 3. Инициализирует Doppler SDK.
   * 4. Получает секреты из Doppler для указанного проекта и окружения.
   * 5. Парсит полученные секреты в объект `AppConfig`.
   * 6. Кэширует конфигурацию и сохраняет ее в статическом свойстве `_config`.
   * 7. Устанавливает флаг `_initialized` в `true` после успешной инициализации.
   * @throws {Error} Если не удается инициализировать конфигурацию (например, отсутствует токен Doppler).
   */
  public static async initialize(): Promise<void> {
    try {
      // Загружаем переменные окружения только один раз, чтобы избежать повторной загрузки.
      if (!ServantsConfigOperator._envLoaded) {
        await load();
        ServantsConfigOperator._envLoaded = true;
      }

      // Получаем токен Doppler из переменных окружения.
      // В вашем коде использовался `env.SERVANTS_TOKEN`, который является результатом `await load()`.
      // Здесь мы используем `Deno.env.get` после загрузки.
      const dopplerAccessToken = env["SERVANTS_TOKEN"];
      if (!dopplerAccessToken) {
        throw new Error(
          "SERVANTS_TOKEN не установлен в .env или переменных окружения. Пожалуйста, убедитесь, что он настроен."
        );
      }

      // Инициализируем Doppler SDK, если он еще не был инициализирован.
      // Это предотвращает создание нескольких экземпляров SDK.
      if (!ServantsConfigOperator._dopplerSdk) {
        ServantsConfigOperator._dopplerSdk = new DopplerSDK({
          accessToken: dopplerAccessToken,
        });
      }

      // Загружаем секреты из Doppler.
      // 'servants' - это имя проекта Doppler, 'prd' - окружение (production).
      // Используем приведение типа к `Record<string, string>` для удобства доступа к секретам.
      const secrets: Record<string, string> =
        (await ServantsConfigOperator._dopplerSdk.secrets.download(
          "servants",
          "prd"
        )) as Record<string, string>;

      // Создаем объект конфигурации `AppConfig` из полученных секретов.
      // Используем оператор `|| ""` для предоставления пустых строк в случае отсутствия секрета,
      // и `JSON.parse` для массивов, а `Number()` для числовых значений.

      const config: AppConfig = {
        redisUrl: secrets.UPSTASH_REDIS_REST_URL_I || "",
        redisToken: secrets.UPSTASH_REDIS_REST_TOKEN_I || "",
        tgUser: secrets.TG_USER || "",
        tgTech: secrets.TG_TECH || "",
        tgBusiness: secrets.TG_BUSINESS || "",
        allowedOrigins: JSON.parse(secrets.ALLOWED_ORIGINS || "[]") as string[],
        coinsApi: secrets.COINS || "",
        utilsApi: secrets.UTILS || "",
        coinsStoreApi: secrets.COINS_STORE || "",
        mongoDb: secrets.MONGO_DB || "",
        proxyMarketVibe: secrets.PROXY_MARKET_VIBE || "",
        renderOiServer: secrets.RENDER_OI_SERVER || "",
        limitKline: Number(secrets.LIMIT_KLINE) || 52,
        limitOi: Number(secrets.LIMIT_OI) || 52,
        limitFr: Number(secrets.LIMIT_FR) || 53,
        delayInMinutesShort: 5, // Эти значения были жестко заданы в вашем исходном коде.
        delayInMinutesLong: 10, // Сохраняем их здесь.
        projectName: "Bizzar-Market-Vibe", // И это тоже.
      };

      // Кэшируем загруженную конфигурацию.
      ServantsConfigOperator._cache.set("config", config);
      // Сохраняем конфигурацию также в статическом свойстве для прямого доступа.
      ServantsConfigOperator._config = config;
      // Устанавливаем флаг инициализации в true.
      ServantsConfigOperator._initialized = true;
      console.log("💜 ServantsConfigOperator → инициализировано...");
    } catch (err) {
      console.error("Ошибка при инициализации конфигурации:", err);
      // Сбрасываем флаг инициализации при возникновении ошибки,
      // чтобы последующие вызовы `getConfig` выбрасывали ошибку.
      ServantsConfigOperator._initialized = false;
      throw err; // Перебрасываем ошибку, чтобы вызывающий код мог ее обработать.
    }
  }

  /**
   * Возвращает кэшированную конфигурацию сервисов.
   * @returns {AppConfig} Кэшированная конфигурация приложения.
   * @throws {Error} Если конфигурация не была инициализирована.
   */
  public static getConfig(): AppConfig {
    // Проверяем, была ли конфигурация инициализирована и существует ли она.
    if (
      !ServantsConfigOperator._initialized ||
      !ServantsConfigOperator._config
    ) {
      throw new Error(
        "ServantsConfigOperator не инициализирован. Вызовите статический метод initialize() сначала."
      );
    }
    return ServantsConfigOperator._config;
  }

  /**
   * Перезагружает конфигурацию сервисов, повторно вызывая метод `initialize()`.
   * Это полезно для обновления конфигурации без перезапуска всего приложения,
   * например, при изменении секретов в Doppler.
   */
  public static async reload(): Promise<void> {
    console.log("🔄 ServantsConfigOperator → перезагрузка конфигурации...");
    // Сбрасываем флаг инициализации перед перезагрузкой,
    // чтобы `initialize()` выполнил полную загрузку.
    ServantsConfigOperator._initialized = false;
    await ServantsConfigOperator.initialize();
    console.log("✅ ServantsConfigOperator → конфигурация перезагружена.");
  }
}

// Пример использования (для демонстрации):
// Этот блок кода будет выполнен, если файл запускается напрямую через `deno run`.
// В реальном приложении, `ServantsConfigOperator.initialize()` обычно вызывается
// один раз при старте вашего основного приложения или сервиса.
/*
if (import.meta.main) {
  (async () => {
    try {
      console.log("Запуск примера использования ServantsConfigOperator...");
      await ServantsConfigOperator.initialize();
      const config = ServantsConfigOperator.getConfig();
      console.log("Полученная конфигурация (имя проекта):", config.projectName);
      console.log("Лимит Kline:", config.limitKline);

      // Пример перезагрузки конфигурации (раскомментируйте для тестирования):
      // console.log("\nПопытка перезагрузки конфигурации...");
      // await ServantsConfigOperator.reload();
      // const newConfig = ServantsConfigOperator.getConfig();
      // console.log("Перезагруженная конфигурация (имя проекта):", newConfig.projectName);

    } catch (error) {
      console.error("Произошла ошибка при работе с ServantsConfigOperator:", error);
    }
  })();
}
*/
