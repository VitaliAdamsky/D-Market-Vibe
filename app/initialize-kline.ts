import { KlineRepo } from "#kline/kline-repository.ts";
import { ServantsConfigOperator } from "#global/servant-config.ts";

export async function initializeKlineStore() {
  const config = ServantsConfigOperator.getConfig();
  await KlineRepo.initialize(config.limitKline);
}
