// Local development server: serves /public and the API (same handler Vercel runs).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { handle } from './lib/router.js';

const PORT = Number(process.env.PORT || 3000);
const ROOT = path.resolve('public');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (pathname.startsWith('/api/')) return handle(req, res);
  let file = path.join(ROOT, decodeURIComponent(pathname));
  if (!file.startsWith(ROOT)) { res.statusCode = 403; return res.end(); }
  if (pathname.startsWith('/rsvp/')) file = path.join(ROOT, 'rsvp.html');
  else if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = fs.existsSync(`${file}.html`) ? `${file}.html` : path.join(ROOT, 'index.html');
  }
  res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`MyWedPlan running at http://localhost:${PORT}`));
