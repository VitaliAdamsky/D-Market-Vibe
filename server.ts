// server.ts
import { initializeApp } from "#app/initialize-app.ts";
import { initializeConfig } from "#app/initialize-config.ts";
import { initializeCoinsRepo } from "#app/initialize-coins-repo.ts";
import { initializeColorsRepo } from "#app/initialize-colors.ts";
import { initializeKlineStore } from "#app/initialize-kline.ts";
import { scheduleKlineJobs } from "#kline/jobs/job-runner.ts";

const PORT = Number(Deno.env.get("PORT") ?? 3000);

// Конфигурация до старта
await initializeConfig();
await initializeCoinsRepo();
await initializeColorsRepo();
await initializeKlineStore();

// Инициализация приложения
const app = initializeApp();

// Запуск сервера
console.log(`🟢 Server running on http://localhost:${PORT}`);
Deno.serve({ port: PORT }, app.fetch);

scheduleKlineJobs();
