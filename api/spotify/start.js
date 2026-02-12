const { createState, json, getBaseUrl } = require('./_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) return json(res, 500, { error: 'SPOTIFY_CLIENT_ID missing' });

  const baseUrl = getBaseUrl(req);
  const returnTo = String(req.query.return_to || req.query.returnTo || '/');
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `${baseUrl}/api/spotify/callback`;

  const state = createState({ returnTo, t: Date.now() });
  const qs = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'user-top-read user-read-email',
    redirect_uri: redirectUri,
    state
  });

  return json(res, 200, {
    authorizeUrl: `https://accounts.spotify.com/authorize?${qs.toString()}`,
    redirectUri,
    returnTo
  });
};
