import { ServantsConfigOperator } from "#global/servant-config.ts";
import { UnixToNamedTimeRu } from "#shared/utils/time-converter.ts";

import { KlineRepo } from "#kline/kline-repository.ts";
import { TF } from "#models/timeframes.ts";

async function runKlineFetch(timeframe: TF) {
  const limit = ServantsConfigOperator.getConfig().limitKline;

  try {
    await KlineRepo.fetchFreshData(timeframe, limit);
    console.log(
      `😍 [${UnixToNamedTimeRu(
        Date.now()
      )}] Kline Cache ${timeframe} --> updated...`
    );
  } catch (error) {
    console.error(
      `❌ [${UnixToNamedTimeRu(
        Date.now()
      )}] Failed to update Kline cache for ${timeframe}`,
      error instanceof Error ? error.message : error
    );
  }
}

import { TIMEFRAME_CONFIG } from "#kline/config/timeframe-config.ts";

export function scheduleKlineJobs() {
  Object.entries(TIMEFRAME_CONFIG).forEach(
    ([tf, { cron: cronTime, delay }]) => {
      Deno.cron(`kline-${tf}`, cronTime, () => {
        console.log(
          `👉 [KLINE JOB] Scheduled ${tf} job (cron: ${cronTime}, delay: ${delay} min)`
        );

        const delayMs = delay * 60 * 1000;

        setTimeout(() => {
          console.log(
            `${getIcon()}` + ` [KLINE JOB] Running ${tf} job after ${delay} min`
          );
          runKlineFetch(tf as TF);
        }, delayMs);
      });

      console.log(
        `${getIcon()} ` +
          ` [KLINE JOB] for ${tf} is set up with cron: ${cronTime}`
      );
    }
  );
}

function getIcon(): string {
  const icons = ["✨", "💜", "🟢", "🔥"];
  const randomIndex = Math.floor(Math.random() * icons.length);
  return icons[randomIndex];
}
