// refresh-coins-controller.ts

// Импортируем Context напрямую из основного пакета Hono для обеспечения совместимости типов.
import { Context } from "hono"; // <-- ИСПРАВЛЕНО: Изменено с "hono/context" на "hono"
import { CoinRepo } from "#coins/coins-repo.ts";

/**
 * Hono-обработчик для обновления кэша монет.
 * Этот обработчик вызывает метод инициализации CoinRepo, который, в свою очередь,
 * получает данные из API, сжимает их и кэширует.
 * @param c - Объект контекста Hono.
 * @returns {Promise<Response>} - Ответ с сообщением об успехе или ошибке.
 */
export const refreshCoinsCacheHandler = async (
  c: Context
): Promise<Response> => {
  try {
    // Выполняем основную логику обновления кэша через CoinRepo.
    // CoinRepo.initialize() теперь включает логику получения, сжатия и кэширования.
    await CoinRepo.initialize();

    // В Hono мы возвращаем ответ из обработчика.
    // c.json() - это удобный метод для отправки JSON-ответа.
    // Первый аргумент - данные, второй - статус.
    return c.json({ message: "Coins cache refreshed successfully" }, 200);
  } catch (err) {
    // Логируем ошибку на сервере для отладки
    console.error("Error refreshing coins cache:", err);

    // Возвращаем клиенту ответ с ошибкой и статусом 500
    // Проверяем, является ли err экземпляром Error, чтобы безопасно получить .message
    return c.json(
      {
        error: `Failed to refresh coins cache: ${
          err instanceof Error ? err.message : String(err)
        }`,
      },
      500
    );
  }
};

/**
 * Hono-обработчик для получения данных о монетах из кэша.
 * Этот обработчик использует CoinRepo для извлечения распакованных данных
 * о монетах из кэша и возвращает их в виде JSON-ответа.
 * @param c - Объект контекста Hono.
 * @returns {Promise<Response>} - Ответ с данными о монетах или сообщением об ошибке.
 */
export const getCoinsHandler = async (c: Context): Promise<Response> => {
  try {
    // Получаем данные о монетах из кэша с помощью CoinRepo.
    // CoinRepo.getCoinsFromCache() автоматически распаковывает данные.
    const cachedCoins = await CoinRepo.getCoinsFromCache();

    // Возвращаем полученные данные в формате JSON.
    return c.json(cachedCoins, 200);
  } catch (err) {
    // Логируем ошибку на сервере для отладки
    console.error("Error fetching coins from cache:", err);

    // Возвращаем клиенту ответ с ошибкой и статусом 500
    // Проверяем, является ли err экземпляром Error, чтобы безопасно получить .message
    return c.json(
      {
        error: `Failed to retrieve coins from cache: ${
          err instanceof Error ? err.message : String(err)
        }`,
      },
      500
    );
  }
};

/*
// Пример того, как вы можете использовать эти обработчики в вашем приложении Hono:

import { Hono } from "https://deno.land/x/hono/mod.ts";
import { refreshCoinsCacheHandler, getCoinsHandler } from "./refresh-coins-controller.ts"; // Обновленный импорт

const app = new Hono();

// Маршрут для обновления кэша
app.post("/refresh-coins-cache", refreshCoinsCacheHandler);

// Маршрут для получения данных о монетах из кэша
app.get("/coins", getCoinsHandler);

// Запуск сервера Deno
// Deno.serve(app.fetch);

// Важно: Перед запуском сервера убедитесь, что ServantsConfigOperator инициализирован,
// так как CoinRepo зависит от него для получения конфигурации API.
// Это должно быть сделано один раз при старте вашего приложения:
// import { ServantsConfigOperator } from "#global/servant-config.ts";
// (async () => {
//   try {
//     await ServantsConfigOperator.initialize();
//     console.log("ServantsConfigOperator initialized.");
//     Deno.serve(app.fetch);
//   } catch (error) {
//     console.error("Failed to initialize application:", error);
//     Deno.exit(1);
//   }
// })();
*/
