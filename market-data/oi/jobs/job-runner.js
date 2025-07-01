const { CronJob } = require("cron");

const {
  getServantConfig,
} = require("@global/servants/servant-config/service.js");

const { TIMEFRAME_CONFIG } = require("@oi/config/timeframe.config.js");

const {
  fetchOpenInterestData,
} = require("@oi/functions/fetches/fetch-oi-data.js");

const { setOpenInterestCache } = require("@oi/cache/service.js");

const { UnixToNamedTimeRu } = require("@shared/utils/time-converter.js");

async function runOpenInterestFetch(timeframe) {
  const limit = getServantConfig().limitKline;
  try {
    const data = await fetchOpenInterestData(timeframe, limit);
    setOpenInterestCache(timeframe, data);
    console.log(
      `💟 [${UnixToNamedTimeRu(
        Date.now()
      )}] OI Cache ${timeframe} ---> updated...`
    );
  } catch (error) {
    console.error(
      `❌ [${UnixToNamedTimeRu(
        Date.now()
      )}] Failed to update OI Cache for ${timeframe}`,
      error instanceof Error ? error.message : error
    );
  }
}

function scheduleOpenInterestJobs() {
  Object.keys(TIMEFRAME_CONFIG).forEach((tf) => {
    const { cron, delay } = TIMEFRAME_CONFIG[tf];

    // Create a new CronJob
    const job = new CronJob(
      cron,
      () => {
        console.log(
          `🤙 [OI JOB] Scheduled ${tf} job (cron: ${cron}, delay: ${delay} min)`
        );

        setTimeout(() => {
          console.log(`🛠 [OI JOB] Running ${tf} job after ${delay} min`);
          runOpenInterestFetch(tf);
        }, 3 * 1000); // Convert minutes to milliseconds
      },
      null, // onComplete callback
      true, // Start the job right now
      "UTC" // Time zone
    );

    console.log(`☝️ [OI JOB] for ${tf} is set up with cron: ${cron}`);

    job.start(); // Start the job
  });
}

module.exports = {
  scheduleOpenInterestJobs,
};
