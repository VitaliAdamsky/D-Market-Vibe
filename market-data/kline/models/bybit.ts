export type BybitRawKline = [
  string,
  string,
  string,
  string,
  string,
  string,
  string
];

/**
 * Тип для ответа от Bybit API.
 */
export interface BybitApiResponse {
  retCode: number;
  retMsg: string;
  result: {
    symbol: string;
    category: string;
    list: BybitRawKline[];
  };
  retExtInfo: object;
  time: number;
}
