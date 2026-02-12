const fs = require('fs');
const path = require('path');

const mappingsPath = path.resolve(process.cwd(), 'data/mappings.json');

function normalizeName(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readMappings() {
  try {
    const raw = fs.readFileSync(mappingsPath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.entries) ? parsed.entries : [];
  } catch {
    return [];
  }
}

function recommendFromTopArtists(topArtists) {
  const mappings = readMappings();
  const mapByArtist = new Map();

  mappings.forEach(entry => {
    const key = normalizeName(entry.artist_name);
    if (key && !mapByArtist.has(key)) {
      mapByArtist.set(key, entry);
    }
  });

  const risky = topArtists
    .map(artist => {
      const key = normalizeName(artist.name);
      const match = mapByArtist.get(key);
      if (!match) return null;

      return {
        spotifyArtist: artist.name,
        charityName: match.charity_name,
        charityEin: match.charity_ein,
        reason: match.note || '',
        suggestedDonationUsd: Number(match.suggested_donation_usd || 5)
      };
    })
    .filter(Boolean)
    .slice(0, 5);

  return {
    matchedCount: risky.length,
    riskyRecommendations: risky,
    overallSuggestedDonationUsd: risky.reduce((sum, r) => sum + Number(r.suggestedDonationUsd || 0), 0)
  };
}

module.exports = { recommendFromTopArtists, normalizeName };
