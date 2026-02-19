const crypto = require('crypto');

const DEFAULT_SECRET = 'play-it-forward-demo-secret';
const STATE_TTL_MS = 10 * 60 * 1000;

function json(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (!host) throw new Error('Host header missing');
  return `${proto}://${host}`;
}

function readSigningSecret() {
  return process.env.SPOTIFY_STATE_SECRET || DEFAULT_SECRET;
}

function b64url(input) {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function signText(text) {
  return crypto.createHmac('sha256', readSigningSecret()).update(text).digest('base64url');
}

function constantEqual(a, b) {
  const aBuf = Buffer.from(String(a || ''), 'utf8');
  const bBuf = Buffer.from(String(b || ''), 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function sanitizeReturnTo(value) {
  const raw = String(value || '/').trim();
  if (!raw.startsWith('/')) return '/';
  if (raw.startsWith('//')) return '/';
  return raw;
}

function createState(payload) {
  const issuedAt = Date.now();
  const packed = {
    ...payload,
    returnTo: sanitizeReturnTo(payload.returnTo),
    iat: issuedAt,
    exp: issuedAt + STATE_TTL_MS
  };
  const encoded = b64url(JSON.stringify(packed));
  const sig = signText(encoded);
  return `${encoded}.${sig}`;
}

function parseState(state) {
  if (!state || !String(state).includes('.')) return null;
  const [encoded, sig] = String(state).split('.');
  const expected = signText(encoded);
  if (!constantEqual(sig, expected)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    parsed.returnTo = sanitizeReturnTo(parsed.returnTo);
    return parsed;
  } catch {
    return null;
  }
}

async function fetchJson(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const text = await res.text();
    let payload = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { raw: text };
    }
    return { ok: res.ok, status: res.status, payload };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw new Error(`Network request failed: ${error.message}`);
  } finally {
    clearTimeout(timer);
  }
}

async function exchangeCodeForToken({ code, redirectUri }) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET not configured in Vercel env.');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri
  });

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenRes = await fetchJson('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!tokenRes.ok) {
    throw new Error(tokenRes.payload.error_description || tokenRes.payload.error || 'Token exchange failed');
  }

  return tokenRes.payload;
}

function signToken(token) {
  const sig = signText(token);
  return `${token}.${sig}`;
}

function verifySignedToken(signed) {
  if (!signed || !signed.includes('.')) return null;
  const [token, sig] = signed.split('.');
  const expected = signText(token);
  if (!constantEqual(sig, expected)) return null;
  return token;
}

module.exports = {
  createState,
  parseState,
  json,
  getBaseUrl,
  sanitizeReturnTo,
  fetchJson,
  exchangeCodeForToken,
  signToken,
  verifySignedToken
};
