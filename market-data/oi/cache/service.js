const {
  compressToGzipBase64,
  decompressFromGzipBase64,
} = require("@shared/utils/compression-utils.js");

const { oiCaches } = require("@oi/cache/store.js");

const {
  TIMEFRAME_CONFIG,
  VALID_TIMEFRAMES,
} = require("@oi/config/timeframe.config.js");

function setOpenInterestCache(tf, data) {
  assertTimeframe(tf);

  if (typeof data !== "object") {
    throw new Error("OI Cache: Data must be a JSON-serializable object.");
  }

  const compressedBuffer = compressToGzipBase64(data);
  oiCaches[tf].set("data", compressedBuffer, TIMEFRAME_CONFIG[tf].ttl || 0);
}

function getOpenInterestCache(tf) {
  assertTimeframe(tf);
  const buffer = oiCaches[tf].get("data");
  if (!buffer) return null;
  const decompressed = decompressFromGzipBase64(buffer);
  return decompressed;
}

function assertTimeframe(tf) {
  if (!oiCaches[tf]) {
    throw new Error(
      `Unsupported timeframe "${tf}". Supported: ${VALID_TIMEFRAMES.join(", ")}`
    );
  }
}

module.exports = {
  setOpenInterestCache,
  getOpenInterestCache,
};
