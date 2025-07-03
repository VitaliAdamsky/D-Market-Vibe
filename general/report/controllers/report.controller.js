const { fetchReport } = require("@general/report/functions/fetch-report.js");

const {
  getFullUrlFromRequest,
} = require("@general/report/functions/get-full-url-from-request.js");

const { setUrlCacheData } = require("@general/report/cache/service.js");

const {
  scheduleSelfPing,
  stopSelfPing,
} = require("@general/report/jobs/job-runner.js");

function getReportController(_req, res, next) {
  try {
    // Use await if fetchReport is an asynchronous function
    const data = fetchReport();

    // Set headers for JSON response
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "max-age=60");

    // Send the JSON data
    res.json(data);
  } catch (err) {
    console.error("Error fetching report data:", err);
    return next(err);
  }
}

function startSelfPingingController(req, res, next) {
  try {
    const data = getFullUrlFromRequest(req);
    setUrlCacheData(data);
    scheduleSelfPing();
    // Send the JSON data
    res.json({ url: data });
  } catch (err) {
    console.error("Error fetching report data:", err);
    return next(err);
  }
}

function stopSelfPingingController(_req, res, next) {
  try {
    stopSelfPing();
    res.json({ success: true });
  } catch (err) {
    console.error("Error fetching report data:", err);
    return next(err);
  }
}

module.exports = {
  getReportController,
  startSelfPingingController,
  stopSelfPingingController,
};
