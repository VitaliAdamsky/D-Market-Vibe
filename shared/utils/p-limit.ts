import pLimit from "npm:p-limit";

export function getPLimit(concurrency = 5) {
  return pLimit(concurrency);
}
