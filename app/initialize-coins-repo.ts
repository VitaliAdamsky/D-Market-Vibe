import { CoinRepo } from "#coins/coins-repo.ts";

export async function initializeCoinsRepo() {
  await CoinRepo.initialize();
}
