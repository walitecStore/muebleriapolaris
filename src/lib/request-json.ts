export class RequestJsonError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
/** Enforce the actual streamed size, including requests without Content-Length. */
export async function readRequestJson(request: Request, maxBytes = 65536): Promise<unknown> {
  if (!request.body) throw new RequestJsonError('El cuerpo de la solicitud está vacío.', 400);
  const reader = request.body.getReader(),
    chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RequestJsonError('La solicitud es demasiado grande.', 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new RequestJsonError('JSON no válido.', 400);
  }
}
