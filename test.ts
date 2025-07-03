import { CoinsRepo } from "#coins/coins-repo.ts";
import { ServantsConfigOperator } from "#global/servant-config.ts";
import { Redis } from "redis";

await ServantsConfigOperator.initialize();

const config = ServantsConfigOperator.getConfig();
const key = config.redisToken;
const val = config.redisUrl;
const redis = new Redis({
  url: config.redisUrl,
  token: config.redisToken,
});

await redis.set(key, val);
const result = await redis.get(key);

console.log("Value from Redis:", result);
