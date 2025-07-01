// Этот код написан для работы с вашим import_map.json.
// Он использует короткие пути "hono" и "hono/factory".
import { type Context, type Next } from "hono";
import { createMiddleware } from "hono/factory";

// Определяем, какие данные мы будем добавлять в контекст Hono
type ValidatedVariables = {
  timeframe: string;
  limit: number;
};

/**
 * Hono Middleware для валидации параметров запроса 'timeframe' и 'limit'.
 */
export const validationMiddleware = createMiddleware<{
  Variables: { validatedParams: ValidatedVariables };
}>(async (c: Context, next: Next) => {
  const supportedTimeframes = [
    "1m",
    "5m",
    "15m",
    "30m",
    "1h",
    "4h",
    "6h",
    "8h",
    "12h",
    "D",
  ];

  const timeframe = c.req.query("timeframe") || "4h";
  const limitStr = c.req.query("limit") || "52";
  const limit = parseInt(limitStr, 10);

  if (!supportedTimeframes.includes(timeframe)) {
    return c.json(
      {
        success: false,
        error: `Invalid timeframe. Supported values are: ${supportedTimeframes.join(
          ", "
        )}`,
      },
      400 // Bad Request
    );
  }

  if (isNaN(limit) || limit < 1 || limit > 1000) {
    return c.json(
      {
        success: false,
        error: "Invalid limit. Must be a number between 1 and 1000.",
      },
      400 // Bad Request
    );
  }

  c.set("validatedParams", { timeframe, limit });

  await next();
});
