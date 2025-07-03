// deno-lint-ignore-file no-explicit-any
import { ServantsConfigOperator } from "#global/servant-config.ts";
import { VALID_TIMEFRAMES } from "../config/timeframe.config.ts";
import { fetchKlineData } from "./fetches/fetch-kline-data.ts";
import { TF } from "#models/timeframes.ts";

export function initializeKlineStore() {
  for (const config of VALID_TIMEFRAMES) {
    const { timeframe, delay: delayMs } = config;

    console.log(
      `⏱ Kline Store [${timeframe}] will init after ${delayMs / 60000} min`
    );

    setTimeout(async () => {
      try {
        const limit = ServantsConfigOperator.getConfig().limitKline;
        const data = await fetchKlineData(timeframe as TF, limit);

        console.log(
          `💛 Kline [${timeframe}] Cache initialized | Data size: ${data.data.length}`
        );
      } catch (err: any) {
        console.error(
          `❌ Kline [${timeframe}] failed to initialize cache:`,
          err.message || err
        );
        console.log(err);
      }
    }, delayMs);
  }
}
