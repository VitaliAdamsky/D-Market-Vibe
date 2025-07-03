import { ServantsConfigOperator } from "#global/servant-config.ts";
import { Colors } from "#colors/models/colors.ts";

/**
 * Репозиторий для управления данными о цветах.
 * Предоставляет статические методы для получения и сохранения конфигураций цветов.
 */
export class ColorsRepository {
  /**
   * Кэшированные данные о цветах для быстрого доступа.
   * @private
   */
  private static cachedColors: Colors | undefined;

  /**
   * Инициализирует репозиторий, загружая и кэшируя данные о цветах.
   * Этот метод следует вызывать один раз при запуске приложения.
   * @param {boolean} [useDefault=false] - Если true, загружает и кэширует цвета по умолчанию.
   * @returns {Promise<void>}
   */
  public static async initialize(useDefault = false): Promise<void> {
    this.cachedColors = await this.getColors(useDefault);

    if (this.cachedColors) {
      console.log("🌈 CoinsRepo → инициализирован...");
    } else {
      console.error("❌ Failed to cache colors during initialization.");
    }
  }

  /**
   * Возвращает кэшированные цвета.
   * Убедитесь, что вы вызвали `initialize()` перед использованием этого метода.
   * @returns {Colors | undefined} Объект с цветами или undefined, если кэш пуст.
   */
  public static getCachedColors(): Colors | undefined {
    return this.cachedColors;
  }

  /**
   * Получает объект с цветами с удаленного API.
   * Этот метод всегда выполняет сетевой запрос, игнорируя кэш.
   * @param {boolean} [useDefault=false] - Если true, запрашивает цвета по умолчанию.
   * @returns {Promise<Colors | undefined>} Объект с цветами или undefined в случае ошибки.
   */
  public static async getColors(
    useDefault = false
  ): Promise<Colors | undefined> {
    const config = ServantsConfigOperator.getConfig();
    const endpoint = useDefault ? "/api/colors/get-default" : "/api/colors/get";
    const url = `${config.utilsApi}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        // Выбрасываем ошибку, если HTTP-статус не успешный
        throw new Error(`Failed to fetch colors. Status: ${response.status}`);
      }

      const result: Colors | { error: unknown } = await response.json();

      // Проверяем, не вернул ли API ошибку в теле ответа
      if ("error" in result) {
        throw new Error(
          `API returned an error: ${JSON.stringify(result.error)}`
        );
      }

      return result;
    } catch (error) {
      console.error("❌ [ColorsRepository.getColors] Error:", error);
      // Возвращаем undefined, чтобы вызывающий код мог обработать ошибку
      return undefined;
    }
  }

  /**
   * Отправляет (сохраняет) объект с цветами на удаленный API.
   * Также обновляет локальный кэш в случае успеха.
   * @param {Colors} data - Объект с цветами для сохранения.
   * @param {boolean} [isDefault=false] - Если true, сохраняет цвета как дефолтные.
   * @returns {Promise<boolean>} Возвращает true в случае успеха и false в случае ошибки.
   */
  public static async saveColors(
    data: Colors,
    isDefault = false
  ): Promise<boolean> {
    const config = ServantsConfigOperator.getConfig();
    const endpoint = isDefault ? "/api/colors/set-default" : "/api/colors/set";
    const url = `${config.utilsApi}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to post colors. Status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ [ColorsRepository.saveColors] Success:", result);

      // Обновляем кэш, если сохраняли не дефолтные цвета
      if (!isDefault) {
        this.cachedColors = data;
      }

      return true;
    } catch (error) {
      console.error("❌ [ColorsRepository.saveColors] Error:", error);
      return false;
    }
  }
}
