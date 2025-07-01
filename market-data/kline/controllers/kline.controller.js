const {
  validateRequestParams,
} = require("@shared/validators/validate-request-params.js");

const { getKlineCache } = require("@kline/cache/service.js");

const {
  initializeKlineStore,
} = require("@kline/functions/initialize-kline-store.js");

async function getKlineDataController(req, res, next) {
  try {
    const { timeframe } = validateRequestParams(req.query);
    const data = getKlineCache(timeframe);
    // Set headers for JSON response
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "max-age=60");

    // Send the decompressed JSON data
    res.json(data);
  } catch (err) {
    console.error("Error fetching kline data:", err);
    return next(err);
  }
}

async function refreshKlineStoreController(req, res, next) {
  try {
    const { limit } = validateRequestParams(req.query);

    await initializeKlineStore(limit);

    // 3) Return coins array as JSON
    return res.status(200).json({ message: "OI store refreshed" });
  } catch (err) {
    // 4) On error, reset cache to avoid stale data
    console.error("Error fetching open interest:", err);
    // Delegate error handling to Express
    return next(err);
  }
}

module.exports = {
  getKlineDataController,
  refreshKlineStoreController,
};
