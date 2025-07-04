// app/initialize-app.ts

import { Hono } from "hono";
import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";

import { ServantsConfigOperator } from "#global/servant-config.ts";
import coinsRouter from "#coins/routes/coins.route.ts";
import colorsRouter from "#colors/routes/colors.route.ts";
import marketRouter from "#kline/routes/market.route.ts";

export function initializeApp(): Hono {
  const config = ServantsConfigOperator.getConfig();
  const allowedOrigins = config.allowedOrigins;

  if (!Array.isArray(allowedOrigins) || allowedOrigins.length === 0) {
    throw new Error(
      "No valid allowed origins found in configuration for CORS."
    );
  }

  const app = new Hono();

  // Безопасно и строго типизировано
  app.use("*", cors({ origin: allowedOrigins }) as MiddlewareHandler);

  // Роуты
  app.route("/api/coins", coinsRouter);
  app.route("/api/colors", colorsRouter);
  app.route("/api/market", marketRouter);

  app.get("/api", (c) => c.text("🔥 Welcome to the Market Vibe API (Hono)!"));

  return app;
}
