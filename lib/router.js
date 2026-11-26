import { HttpError, send } from './http.js';
import { coreRoutes } from './routes/core.js';
import { publicRoutes } from './routes/public.js';
import { integrationRoutes } from './routes/integrations.js';

const routes = [...coreRoutes, ...publicRoutes, ...integrationRoutes].map(([method, pattern, fn]) => {
  const keys = [];
  const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })}/?$`);
  return { method, re, keys, fn };
});

export async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  // On Vercel all /api/* requests are rewritten to one function with the original path in ?__path=
  const rewritten = url.searchParams.get('__path');
  const path = rewritten !== null ? `/api/${rewritten.replace(/^\/+/, '')}` : url.pathname;
  url.searchParams.delete('__path');
  try {
    let matchedPath = false;
    for (const r of routes) {
      const m = path.match(r.re);
      if (!m) continue;
      matchedPath = true;
      if (r.method !== req.method) continue;
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      return await r.fn(req, res, params, url.searchParams);
    }
    send(res, matchedPath ? 405 : 404, { error: matchedPath ? 'Method not allowed' : 'Not found' });
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.message });
    console.error(e);
    send(res, 500, { error: 'Something went wrong on our side. Please try again.' });
  }
}
