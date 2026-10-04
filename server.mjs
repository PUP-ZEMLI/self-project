import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { promisify } from 'node:util';
import { brotliCompress, constants, gzip } from 'node:zlib';

const compressBrotli = promisify(brotliCompress);
const compressGzip = promisify(gzip);
const root = await realpath(resolve(import.meta.dirname));
const host = process.env.HOST || '127.0.0.1';
const port = Number.parseInt(process.env.PORT || '5175', 10);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.ico', 'image/x-icon'],
  ['.woff2', 'font/woff2'],
  ['.ttf', 'font/ttf'],
]);

const compressible = new Set(['.html', '.css', '.js', '.json', '.txt', '.svg']);
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; media-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Permitted-Cross-Domain-Policies': 'none',
};

function send(res, status, headers = {}, body = '') {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(body);
  res.writeHead(status, {
    ...securityHeaders,
    'Content-Length': payload.length,
    ...headers,
  });
  res.end(payload);
}

function isInsideRoot(filePath) {
  const pathFromRoot = relative(root, filePath);
  return pathFromRoot === '' || (!pathFromRoot.startsWith(`..${sep}`) && pathFromRoot !== '..' && !isAbsolute(pathFromRoot));
}

async function encode(body, acceptEncoding) {
  if (/\bbr\b/.test(acceptEncoding)) {
    return {
      body: await compressBrotli(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } }),
      encoding: 'br',
    };
  }
  if (/\bgzip\b/.test(acceptEncoding)) {
    return { body: await compressGzip(body, { level: 6 }), encoding: 'gzip' };
  }
  return { body, encoding: null };
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' }, 'Method not allowed');
    return;
  }

  try {
    if (!req.url || req.url.length > 2048 || req.url.includes('\0')) {
      send(res, 400, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Bad request');
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(url.pathname);
    const requestedPath = pathname === '/' ? '/index.html' : pathname;
    const candidate = resolve(root, `.${requestedPath}`);
    const requestedExtension = extname(candidate).toLowerCase();

    if (!isInsideRoot(candidate) || !contentTypes.has(requestedExtension)) {
      send(res, 403, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Forbidden');
      return;
    }

    const canonicalPath = await realpath(candidate);
    if (!isInsideRoot(canonicalPath)) {
      send(res, 403, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Forbidden');
      return;
    }

    const fileStat = await stat(canonicalPath);
    if (!fileStat.isFile()) throw new Error('Not a file');

    const extension = extname(canonicalPath).toLowerCase();
    const etag = `"${fileStat.size.toString(16)}-${Math.trunc(fileStat.mtimeMs).toString(16)}"`;
    const cacheControl = extension === '.html' || extension === '.css' || extension === '.js'
      ? 'no-cache'
      : 'public, max-age=604800';
    const commonHeaders = {
      'Cache-Control': cacheControl,
      'Content-Type': contentTypes.get(extension) || 'application/octet-stream',
      ETag: etag,
      'Last-Modified': fileStat.mtime.toUTCString(),
      Vary: 'Accept-Encoding',
    };

    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, { ...securityHeaders, ...commonHeaders });
      res.end();
      return;
    }

    const source = await readFile(canonicalPath);
    const encoded = compressible.has(extension)
      ? await encode(source, req.headers['accept-encoding'] || '')
      : { body: source, encoding: null };
    const headers = encoded.encoding
      ? { ...commonHeaders, 'Content-Encoding': encoded.encoding }
      : commonHeaders;

    if (req.method === 'HEAD') {
      res.writeHead(200, { ...securityHeaders, ...headers, 'Content-Length': encoded.body.length });
      res.end();
      return;
    }
    send(res, 200, headers, encoded.body);
  } catch (error) {
    const status = error instanceof URIError ? 400 : 404;
    send(res, status, { 'Content-Type': 'text/plain; charset=utf-8' }, status === 400 ? 'Bad request' : 'Not found');
  }
});

server.requestTimeout = 10_000;
server.headersTimeout = 5_000;
server.keepAliveTimeout = 5_000;
server.maxHeadersCount = 50;

server.listen(port, host, () => {
  console.log(`Self Project: http://${host}:${port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5_000).unref();
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
