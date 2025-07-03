// jobs/selfPing.js

const { CronJob } = require("cron");
const { getUrlCacheData } = require("@general/report/cache/service.js");

let job = null; // Scoped outside to be reused

async function fetchSelfPongData() {
  try {
    const url = getUrlCacheData();
    console.log("URL", url);
    if (url) {
      const response = await fetch(`${url}/api/report`);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      const data = await response.json();
      console.log("🔆 Self Report sent...");
    } else {
      console.log(
        "⚠️ UrlCache is empty. No Self Report URL to send report to."
      );
    }
  } catch (error) {
    console.error("❌ Error sending Self Report:", error);
  }
}

function scheduleSelfPing() {
  if (job) {
    console.warn("🟡 Cron job already scheduled. Ignoring duplicate start.");
    return;
  }

  job = new CronJob(
    "30 */14 * * * *", // every 14 min at :30
    fetchSelfPongData,
    null,
    true, // start immediately
    "UTC"
  );

  console.log("⏳ Scheduled Self-ping: every 14 minutes at :30s (UTC)");
}

function stopSelfPing() {
  if (job && job.running) {
    job.stop();
    console.log("⛔ Self-Ping job stopped.");
  } else {
    console.log("⚠️  No running Self-Ping job to stop.");
  }
}

function isSelfPingRunning() {
  return job?.running ?? false;
}

module.exports = {
  scheduleSelfPing,
  stopSelfPing,
  isSelfPingRunning,
};
