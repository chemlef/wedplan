export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
async function request(method, url, body) {
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(0, 'You appear to be offline. Check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !url.includes('/auth/')) window.dispatchEvent(new CustomEvent('wp:signedout'));
    throw new ApiError(res.status, data.error || `Request failed (${res.status})`);
  }
  return data;
}
export const api = {
  get: (u) => request('GET', u),
  post: (u, b = {}) => request('POST', u, b),
  patch: (u, b = {}) => request('PATCH', u, b),
  del: (u) => request('DELETE', u),
};
