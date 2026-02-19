const { parseState, getBaseUrl, exchangeCodeForToken, signToken, sanitizeReturnTo, resolveRedirectUri } = require('./_lib');

module.exports = async function handler(req, res) {
  const code = String(req.query.code || '');
  const state = String(req.query.state || '');

  if (!code) {
    res.statusCode = 400;
    res.end('Missing code');
    return;
  }

  const parsed = parseState(state);
  if (!parsed) {
    res.statusCode = 400;
    res.end('Invalid or expired OAuth state. Please try connecting Spotify again.');
    return;
  }

  let baseUrl;
  try {
    baseUrl = getBaseUrl(req);
  } catch (error) {
    res.statusCode = 400;
    res.end(error.message);
    return;
  }

  const { redirectUri } = resolveRedirectUri(baseUrl);

  try {
    const token = await exchangeCodeForToken({ code, redirectUri });
    const signed = signToken(token.access_token);

    const returnTo = sanitizeReturnTo(parsed.returnTo || '/');
    const target = new URL(returnTo, baseUrl);
    target.searchParams.set('spotify_connected', '1');

    const isSecure = String(req.headers['x-forwarded-proto'] || '').toLowerCase() === 'https';
    const secureFlag = isSecure ? '; Secure' : '';

    res.setHeader('Set-Cookie', `pif_spotify=${signed}; HttpOnly${secureFlag}; SameSite=Lax; Path=/; Max-Age=3600`);
    res.statusCode = 302;
    res.setHeader('Location', target.toString());
    res.end();
  } catch (error) {
    res.statusCode = 400;
    res.end(`Spotify callback failed: ${error.message}`);
  }
};
