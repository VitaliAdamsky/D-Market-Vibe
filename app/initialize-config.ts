import { ServantsConfigOperator } from "#global/servant-config.ts";

export async function initializeConfig() {
  await ServantsConfigOperator.initialize();
}
