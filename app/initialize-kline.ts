import { KlineRepo } from "#kline/kline-repository.ts";

export async function initializeKlineStore() {
  await KlineRepo.initialize(52);
}
