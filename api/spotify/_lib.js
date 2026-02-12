const crypto = require('crypto');

function json(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

function createState(payload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function parseState(state) {
  try {
    return JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
  } catch {
    return null;
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
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret
  });

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const payload = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error(payload.error_description || payload.error || 'Token exchange failed');
  }

  return payload;
}

function signToken(token) {
  const secret = process.env.SPOTIFY_STATE_SECRET || 'play-it-forward-demo-secret';
  const sig = crypto.createHmac('sha256', secret).update(token).digest('base64url');
  return `${token}.${sig}`;
}

function verifySignedToken(signed) {
  if (!signed || !signed.includes('.')) return null;
  const [token, sig] = signed.split('.');
  const secret = process.env.SPOTIFY_STATE_SECRET || 'play-it-forward-demo-secret';
  const expected = crypto.createHmac('sha256', secret).update(token).digest('base64url');
  if (sig !== expected) return null;
  return token;
}

module.exports = {
  createState,
  parseState,
  json,
  getBaseUrl,
  exchangeCodeForToken,
  signToken,
  verifySignedToken
};
