const {
  compressToGzipBase64,
  decompressFromGzipBase64,
} = require("@shared/utils/compression-utils.js");

const { klineCaches } = require("@kline/cache/store.js");

const {
  TIMEFRAME_CONFIG,
  VALID_TIMEFRAMES,
} = require("@kline/config/timeframe.config.js");

function setKlineCache(tf, data) {
  assertTimeframe(tf);

  if (typeof data !== "object") {
    throw new Error("❌ KLINE CACHE: Data must be a JSON-serializable object.");
  }

  const compressedBuffer = compressToGzipBase64(data);
  klineCaches[tf].set("data", compressedBuffer, TIMEFRAME_CONFIG[tf].ttl || 0);
}

function getKlineCache(tf) {
  assertTimeframe(tf);
  const buffer = klineCaches[tf].get("data");
  if (!buffer) return null;
  const decompressed = decompressFromGzipBase64(buffer);
  return decompressed;
}

function assertTimeframe(tf) {
  if (!klineCaches[tf]) {
    throw new Error(
      `Unsupported timeframe "${tf}". Supported: ${VALID_TIMEFRAMES.join(", ")}`
    );
  }
}

module.exports = {
  setKlineCache,
  getKlineCache,
};
