// timeframe.config.ts
export const TIMEFRAME_CONFIG = {
  "1h": { cron: "0 * * * *", delay: 0, ttl: 0 },
  "4h": { cron: "0 0/4 * * *", delay: 0, ttl: 0 },
  "12h": { cron: "0 0,12 * * *", delay: 0 * 60 * 1000, ttl: 0 },
  D: { cron: "0 0 * * *", delay: 0 * 60 * 1000, ttl: 0 },
};

// Assuming VALID_TIMEFRAMES is an array of timeframe configurations
export const VALID_TIMEFRAMES = Object.entries(TIMEFRAME_CONFIG).map(
  ([timeframe, config]) => ({
    timeframe,
    ...config,
  })
);
