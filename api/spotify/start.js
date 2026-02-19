const { createState, json, getBaseUrl, sanitizeReturnTo, resolveRedirectUri } = require('./_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) return json(res, 500, { error: 'SPOTIFY_CLIENT_ID missing' });

  let baseUrl;
  try {
    baseUrl = getBaseUrl(req);
  } catch (error) {
    return json(res, 400, { error: error.message });
  }

  const returnTo = sanitizeReturnTo(req.query.return_to || req.query.returnTo || '/');
  const { redirectUri, source: redirectUriSource } = resolveRedirectUri(baseUrl);

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
    redirectUriSource,
    returnTo
  });
};
