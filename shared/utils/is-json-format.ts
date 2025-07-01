export function isJsonSerializable(value: unknown) {
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}
