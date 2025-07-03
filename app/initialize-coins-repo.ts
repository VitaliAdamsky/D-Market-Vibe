import { CoinsRepo } from "#coins/coins-repo.ts";

export async function initializeCoinsRepo() {
  await CoinsRepo.initialize();
}
