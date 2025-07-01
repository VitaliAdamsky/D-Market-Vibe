const NodeCache = require("node-cache");

//const { TTL } = require("@kline/cache/ttl.js");
const { TIMEFRAME_CONFIG } = require("@kline/config/timeframe.config.js");

const klineCaches = Object.fromEntries(
  Object.entries(TIMEFRAME_CONFIG).map(([tf, config]) => [
    tf,
    new NodeCache({ stdTTL: config.ttl }),
  ])
);

module.exports = {
  klineCaches,
};
