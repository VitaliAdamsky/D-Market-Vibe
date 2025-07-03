// server.ts
import { initializeApp } from "#app/initialize-app.ts";
import { initializeConfig } from "#app/initialize-config.ts";
import { initializeCoinsRepo } from "#app/initialize-coins-repo.ts";
import { initializeColorsRepo } from "#app/initialize-colors.ts";

const PORT = Number(Deno.env.get("PORT") ?? 3000);

// Конфигурация до старта
await initializeConfig();
await initializeCoinsRepo();
await initializeColorsRepo();

// Инициализация приложения
const app = initializeApp();

// Запуск сервера
console.log(`🟢 Server running on http://localhost:${PORT}`);
Deno.serve({ port: PORT }, app.fetch);
