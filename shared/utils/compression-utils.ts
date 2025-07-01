export class CompressionError extends Error {
  override name = "CompressionError";

  public override cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

/**
 * Конвертируем Uint8Array в base64 строку
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * Конвертируем base64 строку в Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Асинхронно сжимает объект в gzip + base64
 */
export async function compressToGzipBase64Async(
  data: unknown
): Promise<string> {
  try {
    const json = JSON.stringify(data);
    const encoder = new TextEncoder();
    const uint8array = encoder.encode(json);

    // Создаём поток gzip сжатия
    const cs = new CompressionStream("gzip");
    const compressedStream = new Response(uint8array).body!.pipeThrough(cs);
    const compressedBuffer = await new Response(compressedStream).arrayBuffer();
    const compressedBytes = new Uint8Array(compressedBuffer);

    return uint8ArrayToBase64(compressedBytes);
  } catch (error) {
    throw new CompressionError("Ошибка при сжатии данных", error);
  }
}

/**
 * Асинхронно распаковывает base64 gzip в объект
 */
export async function decompressFromGzipBase64Async<T = unknown>(
  base64String: string
): Promise<T> {
  try {
    const compressedBytes = base64ToUint8Array(base64String);

    // Создаём поток распаковки gzip
    const ds = new DecompressionStream("gzip");
    const decompressedStream = new Response(compressedBytes).body!.pipeThrough(
      ds
    );
    const decompressedBuffer = await new Response(
      decompressedStream
    ).arrayBuffer();
    const decompressedBytes = new Uint8Array(decompressedBuffer);

    const decoder = new TextDecoder();
    const json = decoder.decode(decompressedBytes);

    return JSON.parse(json) as T;
  } catch (error) {
    throw new CompressionError("Ошибка при распаковке данных", error);
  }
}
