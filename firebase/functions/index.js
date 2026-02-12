const functions = require('firebase-functions');

const DEMO_ENTRIES = [
  {
    artist_name: 'Kanye West',
    charity_name: 'Anti-Defamation League (anti-hate/education)',
    category: 'anti-hate',
    suggested_donation_usd: 5
  },
  {
    artist_name: 'Chris Brown',
    charity_name: 'National Domestic Violence Hotline',
    category: 'domestic-violence',
    suggested_donation_usd: 5
  },
  {
    artist_name: 'DaBaby',
    charity_name: 'The Trevor Project',
    category: 'lgbtq-support',
    suggested_donation_usd: 5
  },
  {
    artist_name: 'Morgan Wallen',
    charity_name: 'NAACP Legal Defense Fund',
    category: 'anti-racism',
    suggested_donation_usd: 5
  },
  {
    artist_name: 'R. Kelly',
    charity_name: 'RAINN',
    category: 'sexual-violence',
    suggested_donation_usd: 5
  }
];

const CHARITY_CATALOG = [
  { name: 'Anti-Defamation League', ein: '13-1818724', category: 'anti-hate' },
  { name: 'National Domestic Violence Hotline', ein: '75-1658287', category: 'domestic-violence' },
  { name: 'The Trevor Project', ein: '95-4681280', category: 'lgbtq-support' },
  { name: 'NAACP Legal Defense Fund', ein: '13-1655255', category: 'anti-racism' },
  { name: 'RAINN', ein: '52-1886511', category: 'sexual-violence' }
];

function json(res, status, payload) {
  res.status(status).set('Content-Type', 'application/json').send(JSON.stringify(payload));
}

exports.api = functions.https.onRequest(async (req, res) => {
  const path = req.path || '/';

  if (req.method === 'GET' && path === '/health') {
    return json(res, 200, { ok: true, service: 'play-it-forward-firebase-api' });
  }

  if (req.method === 'GET' && path === '/meta/config') {
    return json(res, 200, {
      minDonationUsd: 5,
      roundUpRate: 0.07,
      donationPartner: 'Change',
      modes: ['retune', 'great-listener']
    });
  }

  if (req.method === 'GET' && path.startsWith('/analysis/')) {
    const userId = decodeURIComponent(path.split('/').pop());
    const top5 = DEMO_ENTRIES.map((entry, index) => ({
      rank: index + 1,
      artistName: entry.artist_name,
      charityName: entry.charity_name,
      category: entry.category,
      suggestedDonationUsd: entry.suggested_donation_usd
    }));

    return json(res, 200, {
      userId,
      overallSuggestedDonationUsd: top5.reduce((sum, row) => sum + row.suggestedDonationUsd, 0),
      topRiskyRecommendations: top5
    });
  }

  if (req.method === 'GET' && path === '/charities/search') {
    const q = String(req.query?.q || '').toLowerCase().trim();
    const category = String(req.query?.category || '').toLowerCase().trim();

    const results = CHARITY_CATALOG.filter(item => {
      const matchesQuery = !q || item.name.toLowerCase().includes(q);
      const matchesCategory = !category || item.category === category;
      return matchesQuery && matchesCategory;
    });

    return json(res, 200, { count: results.length, results });
  }

  if (req.method === 'POST' && path === '/donations/checkout') {
    const donationAmount = Number(req.body?.amountUsd || 0);
    if (donationAmount < 5) {
      return json(res, 400, { error: 'Minimum donation is $5.00' });
    }

    const roundUp = req.body?.roundUpProcessingFees === true;
    const roundUpFee = roundUp ? Number((donationAmount * 0.07).toFixed(2)) : 0;
    return json(res, 200, {
      status: 'ready_for_provider_checkout',
      partner: 'Change',
      amountUsd: donationAmount,
      roundUpProcessingFees: roundUp,
      roundUpFeeUsd: roundUpFee,
      totalUsd: Number((donationAmount + roundUpFee).toFixed(2))
    });
  }

  return json(res, 404, { error: 'Not found' });
});
