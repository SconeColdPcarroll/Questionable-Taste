const { json, verifySignedToken, fetchJson } = require('./_lib');
const { recommendFromTopArtists } = require('./recommend');

function readCookie(req, key) {
  const raw = req.headers.cookie || '';
  const parts = raw.split(';').map(x => x.trim());
  const match = parts.find(x => x.startsWith(`${key}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  const signed = readCookie(req, 'pif_spotify');
  const accessToken = verifySignedToken(signed);
  if (!accessToken) return json(res, 401, { error: 'Not connected to Spotify' });

  const headers = { Authorization: `Bearer ${accessToken}` };

  let meRes;
  let topRes;
  try {
    [meRes, topRes] = await Promise.all([
      fetchJson('https://api.spotify.com/v1/me', { headers }),
      fetchJson('https://api.spotify.com/v1/me/top/artists?limit=5&time_range=medium_term', { headers })
    ]);
  } catch (error) {
    return json(res, 502, { error: `Spotify API unreachable: ${error.message}` });
  }

  if (!meRes.ok) return json(res, meRes.status, { error: meRes.payload.error?.message || 'Spotify profile failed' });
  if (!topRes.ok) return json(res, topRes.status, { error: topRes.payload.error?.message || 'Spotify top artists failed' });

  const me = meRes.payload;
  const top = topRes.payload;

  const topArtists = (top.items || []).map((a, index) => ({
    rank: index + 1,
    id: a.id,
    name: a.name,
    popularity: a.popularity,
    genres: a.genres || []
  }));

  const recs = recommendFromTopArtists(topArtists);

  return json(res, 200, {
    connected: true,
    profile: {
      id: me.id,
      displayName: me.display_name,
      email: me.email,
      country: me.country
    },
    topArtists,
    riskyRecommendations: recs.riskyRecommendations,
    matchedRiskyCount: recs.matchedCount,
    overallSuggestedDonationUsd: recs.overallSuggestedDonationUsd
  });
};
