const { parseState, getBaseUrl, exchangeCodeForToken, signToken } = require('./_lib');

module.exports = async function handler(req, res) {
  const code = String(req.query.code || '');
  const state = String(req.query.state || '');

  if (!code) {
    res.statusCode = 400;
    res.end('Missing code');
    return;
  }

  const parsed = parseState(state) || {};
  const baseUrl = getBaseUrl(req);
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `${baseUrl}/api/spotify/callback`;

  try {
    const token = await exchangeCodeForToken({ code, redirectUri });
    const signed = signToken(token.access_token);

    const returnTo = typeof parsed.returnTo === 'string' ? parsed.returnTo : '/';
    const target = new URL(returnTo, baseUrl);
    target.searchParams.set('spotify_connected', '1');

    res.setHeader('Set-Cookie', `pif_spotify=${signed}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`);
    res.statusCode = 302;
    res.setHeader('Location', target.toString());
    res.end();
  } catch (error) {
    res.statusCode = 400;
    res.end(`Spotify callback failed: ${error.message}`);
  }
};
