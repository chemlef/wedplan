// Spotify playlists and Pinterest boards. (MyWedPlan never sends email: guests get exported drafts instead.)
import { db } from '../db.js';
import { fail, readJson, send, redirect, appUrl } from '../http.js';
import { sign, unsign, weddingAccess, requirePerm } from '../auth.js';


async function getIntegration(wid, provider) {
  const r = await db.get('SELECT data FROM integrations WHERE wedding_id = ? AND provider = ?', [wid, provider]);
  return r ? JSON.parse(r.data) : null;
}
async function saveIntegration(wid, provider, data) {
  await db.run('INSERT INTO integrations (wedding_id, provider, data) VALUES (?, ?, ?) ON CONFLICT (wedding_id, provider) DO UPDATE SET data = excluded.data',
    [wid, provider, JSON.stringify(data)]);
}

// ------------------------------------------------------------------ OAuth helpers
function oauthState(wid, provider) { return sign({ w: wid, p: provider, exp: Date.now() + 15 * 60000 }); }
function readState(state, provider) {
  const s = unsign(state);
  if (!s || s.p !== provider) fail(400, 'This sign-in link has expired. Please try connecting again.');
  return s.w;
}
const basic = (id, secret) => `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`;

// ------------------------------------------------------------------ Spotify
const SP = { id: () => process.env.SPOTIFY_CLIENT_ID, secret: () => process.env.SPOTIFY_CLIENT_SECRET };

async function spotifyConnect(req, res, params, query) {
  const wid = query.get('w');
  const a = await weddingAccess(req, wid);
  requirePerm(a, 'music', 'edit');
  if (!SP.id()) fail(501, 'Spotify is not set up yet. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in Vercel.');
  const u = new URL('https://accounts.spotify.com/authorize');
  u.search = new URLSearchParams({
    response_type: 'code', client_id: SP.id(), redirect_uri: `${appUrl(req)}/api/spotify/callback`,
    scope: 'playlist-modify-private playlist-modify-public user-read-private', state: oauthState(wid, 'spotify'),
  }).toString();
  redirect(res, u.toString());
}

async function spotifyToken(body) {
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: basic(SP.id(), SP.secret()), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  if (!r.ok) fail(502, `Spotify sign-in failed: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

async function spotifyCallback(req, res, params, query) {
  const base = appUrl(req);
  if (query.get('error')) return redirect(res, `${base}/music?spotify=denied`);
  const wid = readState(query.get('state'), 'spotify');
  await weddingAccess(req, wid);
  const t = await spotifyToken({ grant_type: 'authorization_code', code: query.get('code'), redirect_uri: `${base}/api/spotify/callback` });
  const meRes = await fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${t.access_token}` } });
  const me = meRes.ok ? await meRes.json() : {};
  const prev = (await getIntegration(wid, 'spotify')) || {};
  await saveIntegration(wid, 'spotify', {
    ...prev, access_token: t.access_token, refresh_token: t.refresh_token || prev.refresh_token,
    expires_at: Date.now() + (t.expires_in - 60) * 1000, user: { id: me.id, name: me.display_name || me.id },
  });
  redirect(res, `${base}/music?spotify=connected`);
}

async function spotifyApi(wid, path, init = {}) {
  let s = await getIntegration(wid, 'spotify');
  if (!s) fail(400, 'Connect Spotify first');
  if (Date.now() > s.expires_at) {
    const t = await spotifyToken({ grant_type: 'refresh_token', refresh_token: s.refresh_token });
    s = { ...s, access_token: t.access_token, refresh_token: t.refresh_token || s.refresh_token, expires_at: Date.now() + (t.expires_in - 60) * 1000 };
    await saveIntegration(wid, 'spotify', s);
  }
  const r = await fetch(`https://api.spotify.com/v1${path}`, {
    ...init, headers: { Authorization: `Bearer ${s.access_token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  if (r.status === 204) return { s, data: null };
  const data = await r.json().catch(() => null);
  if (!r.ok) fail(r.status === 401 ? 400 : 502, `Spotify: ${data?.error?.message || r.statusText}`);
  return { s, data };
}

async function spotifySearch(req, res, { wid }, query) {
  const a = await weddingAccess(req, wid);
  requirePerm(a, 'music', 'view');
  const q = String(query.get('q') || '').slice(0, 100);
  if (!q) return send(res, 200, { tracks: [] });
  const { data } = await spotifyApi(wid, `/search?${new URLSearchParams({ q, type: 'track', limit: '10' })}`);
  send(res, 200, {
    tracks: (data.tracks?.items || []).map((t) => ({
      spotifyId: t.id, uri: t.uri, title: t.name, artist: t.artists.map((x) => x.name).join(', '),
      album: t.album?.name, image: t.album?.images?.at(-1)?.url || t.album?.images?.[0]?.url, duration: t.duration_ms,
      url: t.external_urls?.spotify,
    })),
  });
}

async function spotifyExport(req, res, { wid }) {
  const a = await weddingAccess(req, wid);
  requirePerm(a, 'music', 'edit');
  const b = await readJson(req);
  const uris = (Array.isArray(b.uris) ? b.uris : []).filter((u) => /^spotify:track:[A-Za-z0-9]+$/.test(u));
  if (!uris.length) fail(400, 'Add songs from Spotify search first — only those can be sent to Spotify.');
  let { s } = await spotifyApi(wid, '/me');
  let playlistId = b.newPlaylist ? null : s.playlistId;
  let url = s.playlistUrl;
  if (playlistId) {
    try {
      await spotifyApi(wid, `/playlists/${playlistId}/items`, { method: 'PUT', body: JSON.stringify({ uris: uris.slice(0, 100) }) });
    } catch { playlistId = null; }
  }
  if (!playlistId) {
    const { data } = await spotifyApi(wid, '/me/playlists', {
      method: 'POST', body: JSON.stringify({ name: String(b.name || 'Our wedding').slice(0, 100), public: false, description: String(b.description || 'Made with MyWedPlan').slice(0, 300) }),
    });
    playlistId = data.id; url = data.external_urls?.spotify;
    await spotifyApi(wid, `/playlists/${playlistId}/items`, { method: 'POST', body: JSON.stringify({ uris: uris.slice(0, 100) }) });
  }
  for (let i = 100; i < uris.length; i += 100) {
    await spotifyApi(wid, `/playlists/${playlistId}/items`, { method: 'POST', body: JSON.stringify({ uris: uris.slice(i, i + 100) }) });
  }
  s = await getIntegration(wid, 'spotify');
  await saveIntegration(wid, 'spotify', { ...s, playlistId, playlistUrl: url });
  send(res, 200, { url, count: uris.length });
}

async function disconnect(req, res, { wid, provider }) {
  const a = await weddingAccess(req, wid);
  requirePerm(a, provider === 'spotify' ? 'music' : 'inspiration', 'edit');
  await db.run('DELETE FROM integrations WHERE wedding_id = ? AND provider = ?', [wid, provider]);
  send(res, 200, { ok: true });
}

// ------------------------------------------------------------------ Pinterest
const PI = { id: () => process.env.PINTEREST_APP_ID, secret: () => process.env.PINTEREST_APP_SECRET };

async function pinterestConnect(req, res, params, query) {
  const wid = query.get('w');
  const a = await weddingAccess(req, wid);
  requirePerm(a, 'inspiration', 'edit');
  if (!PI.id()) fail(501, 'Pinterest is not set up yet. Add PINTEREST_APP_ID and PINTEREST_APP_SECRET in Vercel.');
  const u = new URL('https://www.pinterest.com/oauth/');
  u.search = new URLSearchParams({
    response_type: 'code', client_id: PI.id(), redirect_uri: `${appUrl(req)}/api/pinterest/callback`,
    scope: 'boards:read,pins:read,user_accounts:read', state: oauthState(wid, 'pinterest'),
  }).toString();
  redirect(res, u.toString());
}

async function pinterestToken(body) {
  const r = await fetch('https://api.pinterest.com/v5/oauth/token', {
    method: 'POST',
    headers: { Authorization: basic(PI.id(), PI.secret()), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  if (!r.ok) fail(502, `Pinterest sign-in failed: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

async function pinterestCallback(req, res, params, query) {
  const base = appUrl(req);
  if (query.get('error')) return redirect(res, `${base}/inspiration?pinterest=denied`);
  const wid = readState(query.get('state'), 'pinterest');
  await weddingAccess(req, wid);
  const t = await pinterestToken({ grant_type: 'authorization_code', code: query.get('code'), redirect_uri: `${base}/api/pinterest/callback` });
  const meRes = await fetch('https://api.pinterest.com/v5/user_account', { headers: { Authorization: `Bearer ${t.access_token}` } });
  const me = meRes.ok ? await meRes.json() : {};
  await saveIntegration(wid, 'pinterest', {
    access_token: t.access_token, refresh_token: t.refresh_token, expires_at: Date.now() + ((t.expires_in || 2592000) - 60) * 1000,
    user: { id: me.username, name: me.username },
  });
  redirect(res, `${base}/inspiration?pinterest=connected`);
}

async function pinterestApi(wid, path) {
  let s = await getIntegration(wid, 'pinterest');
  if (!s) fail(400, 'Connect Pinterest first');
  if (Date.now() > s.expires_at && s.refresh_token) {
    const t = await pinterestToken({ grant_type: 'refresh_token', refresh_token: s.refresh_token });
    s = { ...s, access_token: t.access_token, refresh_token: t.refresh_token || s.refresh_token, expires_at: Date.now() + ((t.expires_in || 2592000) - 60) * 1000 };
    await saveIntegration(wid, 'pinterest', s);
  }
  const r = await fetch(`https://api.pinterest.com/v5${path}`, { headers: { Authorization: `Bearer ${s.access_token}` } });
  const data = await r.json().catch(() => null);
  if (!r.ok) fail(502, `Pinterest: ${data?.message || r.statusText}`);
  return data;
}

async function pinterestBoards(req, res, { wid }) {
  const a = await weddingAccess(req, wid);
  requirePerm(a, 'inspiration', 'view');
  const data = await pinterestApi(wid, '/boards?page_size=100');
  send(res, 200, {
    boards: (data.items || []).map((b) => ({ id: b.id, name: b.name, count: b.pin_count, image: b.media?.image_cover_url || null })),
  });
}

async function pinterestPins(req, res, { wid, bid }) {
  const a = await weddingAccess(req, wid);
  requirePerm(a, 'inspiration', 'view');
  const data = await pinterestApi(wid, `/boards/${encodeURIComponent(bid)}/pins?page_size=100`);
  send(res, 200, {
    pins: (data.items || []).map((p) => {
      const imgs = p.media?.images || {};
      const img = imgs['600x'] || imgs['1200x'] || imgs['400x300'] || Object.values(imgs)[0];
      return { id: p.id, title: p.title || '', description: p.description || '', image: img?.url || null, link: p.link || `https://www.pinterest.com/pin/${p.id}/` };
    }).filter((p) => p.image),
  });
}

async function config(req, res) {
  send(res, 200, { spotify: !!process.env.SPOTIFY_CLIENT_ID, pinterest: !!process.env.PINTEREST_APP_ID });
}

export const integrationRoutes = [
  ['GET', '/api/config', config],
  ['GET', '/api/spotify/connect', spotifyConnect],
  ['GET', '/api/spotify/callback', spotifyCallback],
  ['GET', '/api/w/:wid/spotify/search', spotifySearch],
  ['POST', '/api/w/:wid/spotify/export', spotifyExport],
  ['GET', '/api/pinterest/connect', pinterestConnect],
  ['GET', '/api/pinterest/callback', pinterestCallback],
  ['GET', '/api/w/:wid/pinterest/boards', pinterestBoards],
  ['GET', '/api/w/:wid/pinterest/boards/:bid/pins', pinterestPins],
  ['DELETE', '/api/w/:wid/integrations/:provider', disconnect],
];
