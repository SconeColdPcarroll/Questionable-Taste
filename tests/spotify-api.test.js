const test = require('node:test');
const assert = require('node:assert/strict');

const lib = require('../api/spotify/_lib');
const startHandler = require('../api/spotify/start');
const meHandler = require('../api/spotify/me');

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
      return this;
    },
    end(payload = '') {
      this.body = payload;
      return this;
    }
  };
}

test('createState/parseState roundtrip validates signed state', () => {
  const original = { returnTo: '/dashboard', t: Date.now() };
  const state = lib.createState(original);
  const parsed = lib.parseState(state);
  assert.equal(parsed.returnTo, '/dashboard');
  assert.ok(parsed.exp > parsed.iat);
});

test('parseState rejects tampered state', () => {
  const state = lib.createState({ returnTo: '/safe' });
  const tampered = `${state.slice(0, -1)}x`;
  const parsed = lib.parseState(tampered);
  assert.equal(parsed, null);
});

test('sanitizeReturnTo blocks external and protocol-relative redirects', () => {
  assert.equal(lib.sanitizeReturnTo('https://evil.com'), '/');
  assert.equal(lib.sanitizeReturnTo('//evil.com'), '/');
  assert.equal(lib.sanitizeReturnTo('/safe?ok=1'), '/safe?ok=1');
});

test('resolveRedirectUri ignores SPOTIFY_REDIRECT_URI host mismatch by default', () => {
  process.env.SPOTIFY_REDIRECT_URI = 'https://patryancarroll.bubbleapps.io/version-test/listening_history';
  delete process.env.SPOTIFY_ALLOW_EXTERNAL_REDIRECT_URI;

  const result = lib.resolveRedirectUri('https://questionable-taste.vercel.app');
  assert.equal(result.redirectUri, 'https://questionable-taste.vercel.app/api/spotify/callback');
  assert.equal(result.source, 'default_env_mismatch');
});

test('resolveRedirectUri can allow external callback only when explicitly enabled', () => {
  process.env.SPOTIFY_REDIRECT_URI = 'https://patryancarroll.bubbleapps.io/version-test/listening_history';
  process.env.SPOTIFY_ALLOW_EXTERNAL_REDIRECT_URI = '1';

  const result = lib.resolveRedirectUri('https://questionable-taste.vercel.app');
  assert.equal(result.redirectUri, 'https://patryancarroll.bubbleapps.io/version-test/listening_history');
  assert.equal(result.source, 'env_external_allowed');

  delete process.env.SPOTIFY_ALLOW_EXTERNAL_REDIRECT_URI;
});

test('start handler returns authorize URL and sanitized returnTo', async () => {
  process.env.SPOTIFY_CLIENT_ID = 'abc123';
  delete process.env.SPOTIFY_REDIRECT_URI;

  const req = {
    method: 'GET',
    query: { return_to: 'https://evil.example' },
    headers: { host: 'example.vercel.app', 'x-forwarded-proto': 'https' }
  };
  const res = mockRes();
  await startHandler(req, res);

  assert.equal(res.statusCode, 200);
  const payload = JSON.parse(res.body);
  assert.equal(payload.returnTo, '/');
  assert.match(payload.authorizeUrl, /^https:\/\/accounts\.spotify\.com\/authorize\?/);
  assert.equal(payload.redirectUri, 'https://example.vercel.app/api/spotify/callback');
  assert.equal(payload.redirectUriSource, 'default');
});

test('me handler returns 401 when cookie missing', async () => {
  const req = { method: 'GET', headers: {} };
  const res = mockRes();
  await meHandler(req, res);

  assert.equal(res.statusCode, 401);
  const payload = JSON.parse(res.body);
  assert.equal(payload.error, 'Not connected to Spotify');
});
