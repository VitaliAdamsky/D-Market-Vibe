export interface AppConfig {
  tgUser: string;
  tgTech: string;
  tgBusiness: string;
  allowedOrigins: string[]; // Предполагается, что это массив строк, полученный из JSON.parse
  coinsApi: string;
  utilsApi: string;
  coinsStoreApi: string;
  mongoDb: string;
  proxyMarketVibe: string;
  renderOiServer: string;
  limitKline: number;
  limitOi: number;
  limitFr: number;
  delayInMinutesShort: number;
  delayInMinutesLong: number;
  projectName: string;
}
