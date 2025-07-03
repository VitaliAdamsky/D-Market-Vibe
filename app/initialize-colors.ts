import { ColorsRepository } from "#colors/colors-repo.ts";

export async function initializeColorsRepo() {
  await ColorsRepository.initialize();
}
