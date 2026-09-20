import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)));
const port = 8080;
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

/**
 * Equivalente local a vercel.json (solo rutas /eventos).
 * /eventos y /eventos/{slug} → eventos.html (rewrite, URL intacta).
 * Rutas desconocidas → 404 (sin SPA fallback global).
 */
function resolvePath(urlPath) {
  if (urlPath === '/' || urlPath === '') return '/index.html';

  if (urlPath === '/eventos' || urlPath === '/eventos/') {
    return '/eventos.html';
  }

  const eventosSlug = urlPath.match(/^\/eventos\/([^/]+)\/?$/);
  if (eventosSlug) {
    return '/eventos.html';
  }

  return urlPath;
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const rel = resolvePath(urlPath);
  const file = path.normalize(path.join(root, rel));
  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log('serving ' + root + ' at http://localhost:' + port);
});
