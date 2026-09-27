import { Elysia } from 'elysia';

interface CompressionOptions {
  /**
   * Minimum response byte length to apply compression (default: 1024 bytes = 1KB).
   * Payloads smaller than this usually don't benefit from compression due to header overhead.
   */
  threshold?: number;
}

/**
 * Native Bun Response Compression Plugin for Elysia.
 *
 * Uses Bun's C-accelerated gzip and deflate functions to compress JSON and text responses.
 * Avoids any external npm dependencies and is 100% compatible with modern Elysia.
 */
export const bunCompression = (options: CompressionOptions = {}) => {
  const threshold = options.threshold ?? 1024;

  return new Elysia({ name: 'bun-compression' })
    .onAfterHandle({ as: 'global' }, ({ request, response, set }) => {
      // If already handled or no response, skip
      if (response === undefined || response === null) return;

      // Do not re-compress already formed Response objects (e.g. file downloads, Excel buffers)
      if (response instanceof Response) return;

      // Binary bodies must pass through: JSON.stringify(Buffer) yields {"0":137,"1":80,...} garbage
      if (
        response instanceof ReadableStream ||
        response instanceof Blob ||
        response instanceof ArrayBuffer ||
        response instanceof FormData ||
        response instanceof URLSearchParams ||
        ArrayBuffer.isView(response)
      ) return;

      const declaredType = (set.headers['content-type'] as string) || '';
      if (declaredType && !/(json|text|csv|javascript|html|xml)/i.test(declaredType)) return;

      const acceptEncoding = request.headers.get('accept-encoding') || '';
      if (!acceptEncoding) return;

      let bodyBuffer: Uint8Array | null = null;
      let contentType = 'application/json; charset=utf-8';

      if (typeof response === 'string') {
        if (Buffer.byteLength(response) < threshold) return;
        bodyBuffer = Buffer.from(response);
        contentType = (set.headers['content-type'] as string) || 'text/plain; charset=utf-8';
      } else if (typeof response === 'object') {
        const jsonString = JSON.stringify(response);
        if (Buffer.byteLength(jsonString) < threshold) return;
        bodyBuffer = Buffer.from(jsonString);
        contentType = (set.headers['content-type'] as string) || 'application/json; charset=utf-8';
      }

      if (!bodyBuffer) return;

      // Prefer gzip, fallback to deflate
      if (acceptEncoding.includes('gzip')) {
        const compressed = Bun.gzipSync(bodyBuffer as any);
        const headers = new Headers(set.headers as Record<string, string>);
        headers.set('content-encoding', 'gzip');
        headers.set('content-type', contentType);
        headers.set('vary', 'Accept-Encoding');
        return new Response(compressed as BodyInit, {
          status: typeof set.status === 'number' ? set.status : 200,
          headers,
        });
      }

      if (acceptEncoding.includes('deflate')) {
        const compressed = Bun.deflateSync(bodyBuffer as any);
        const headers = new Headers(set.headers as Record<string, string>);
        headers.set('content-encoding', 'deflate');
        headers.set('content-type', contentType);
        headers.set('vary', 'Accept-Encoding');
        return new Response(compressed as BodyInit, {
          status: typeof set.status === 'number' ? set.status : 200,
          headers,
        });
      }
    });
};
