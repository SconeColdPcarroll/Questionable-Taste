const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 4000);
const ADMIN_KEY = process.env.ADMIN_KEY || 'play-it-forward-admin';
const mappingsPath = path.resolve(__dirname, '../../../data/mappings.json');

function splitCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parseDirectMappingRows(rawText) {
  const normalized = String(rawText || '')
    .replace(/\\n/g, '\n')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && line.includes(','));

  if (normalized.length < 2) {
    return [];
  }

  const headers = splitCsvLine(normalized[0]);
  const headerSignature = headers.join('|').toLowerCase();
  const rows = normalized
    .slice(1)
    .map(line => splitCsvLine(line))
    .filter(values => values.join('|').toLowerCase() !== headerSignature)
    .map(values => {
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      return row;
    });

  return rows;
}

function toNumeric(input) {
  const parsed = Number(String(input || '').replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function readMappings() {
  try {
    const raw = fs.readFileSync(mappingsPath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      generatedAt: parsed.generatedAt || new Date().toISOString(),
      entries: Array.isArray(parsed.entries) ? parsed.entries : []
    };
  } catch {
    return { generatedAt: new Date().toISOString(), entries: [] };
  }
}

function writeMappings(entries) {
  const payload = {
    generatedAt: new Date().toISOString(),
    entries
  };

  fs.writeFileSync(mappingsPath, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
  });
}

function json(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function text(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(payload);
}

function requireAdminKey(req, res) {
  const key = req.headers['x-admin-key'];
  if (key !== ADMIN_KEY) {
    json(res, 401, { error: 'Unauthorized admin request' });
    return false;
  }

  return true;
}

function validateEntry(input) {
  const artistName = String(input.artist_name || '').trim();
  const charityName = String(input.charity_name || '').trim();
  const charityEin = String(input.charity_ein || '').trim();

  if (!artistName || !charityName || !charityEin) {
    return { error: 'artist_name, charity_name, and charity_ein are required.' };
  }

  const donation = Number(input.suggested_donation_usd || 5);
  if (!Number.isFinite(donation) || donation < 5) {
    return { error: 'suggested_donation_usd must be a number >= 5.' };
  }

  return {
    entry: {
      artist_id: String(input.artist_id || `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      artist_name: artistName,
      risk_category: String(input.risk_category || 'manual-entry').trim(),
      charity_name: charityName,
      charity_ein: charityEin,
      monthly_listeners: input.monthly_listeners ? Number(input.monthly_listeners) : null,
      note: String(input.note || '').trim(),
      suggested_donation_usd: Number(donation.toFixed(2))
    }
  };
}

function adminHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Play it Forward Admin</title>
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; background: #0b1020; color: #ecf1ff; font-family: Inter, system-ui, -apple-system, sans-serif; }
    .wrap { max-width: 1180px; margin: 24px auto; padding: 0 16px 40px; }
    h1 { font-size: 28px; margin: 0 0 8px; }
    h3 { margin: 0 0 10px; }
    p { color: #b3c0e6; }
    .panel { background: #111937; border: 1px solid #24305f; border-radius: 12px; padding: 16px; margin-top: 16px; }
    .row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    input, textarea { width: 100%; box-sizing: border-box; background: #0b1230; color: #eaf0ff; border: 1px solid #2b3970; border-radius: 8px; padding: 10px; }
    textarea { min-height: 100px; resize: vertical; }
    button { background: linear-gradient(135deg, #5f6dff, #8a5bff); color: white; border: 0; border-radius: 8px; padding: 10px 12px; font-weight: 600; cursor: pointer; }
    button.secondary { background: #24305f; }
    .toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border-bottom: 1px solid #22315f; padding: 8px; text-align: left; font-size: 13px; vertical-align: top; }
    .muted { color: #9fb2ef; font-size: 12px; }
    .right { text-align: right; }
    .tag { background: #18244c; border: 1px solid #2d3d76; border-radius: 999px; padding: 4px 8px; font-size: 12px; display: inline-block; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Play it Forward · Private Admin</h1>
    <p>Manage artist → charity mappings. This page writes directly to <code>data/mappings.json</code>.</p>

    <div class="panel">
      <div class="toolbar">
        <input id="adminKey" placeholder="Admin key (x-admin-key)" style="max-width:320px" />
        <button onclick="loadMappings()">Load Mappings</button>
        <button class="secondary" onclick="downloadJson()">Download JSON</button>
        <input id="filter" placeholder="Filter by artist or charity" style="max-width:300px" oninput="renderRows()" />
        <span id="status" class="muted"></span>
      </div>
    </div>

    <div class="panel">
      <h3>Add mapping</h3>
      <div class="row">
        <input id="artist_name" placeholder="Artist name" />
        <input id="charity_name" placeholder="Charity name" />
        <input id="charity_ein" placeholder="Charity EIN" />
        <input id="risk_category" placeholder="Risk category (optional)" />
        <input id="monthly_listeners" placeholder="Monthly listeners (optional)" />
        <input id="suggested_donation_usd" placeholder="Suggested donation (>=5)" value="5" />
      </div>
      <textarea id="note" placeholder="Internal notes (optional)"></textarea>
      <div style="margin-top:10px"><button onclick="createMapping()">Create mapping</button></div>
    </div>

    <div class="panel">
      <h3>Bulk import from pasted CSV text</h3>
      <p class="muted">Paste rows with headers like <code>Artist,Monthly listeners,Foibles,Recommended charity,EIN</code>. Literal <code>\\n</code> separators are supported.</p>
      <textarea id="bulkCsv" placeholder="Paste your CSV text here"></textarea>
      <div style="margin-top:10px" class="toolbar">
        <button onclick="bulkImport()">Import pasted rows</button>
      </div>
    </div>

    <div class="panel">
      <div class="toolbar" style="justify-content:space-between">
        <h3 style="margin:0">Existing mappings</h3>
        <span id="count" class="tag">0 entries</span>
      </div>
      <table>
        <thead>
          <tr><th>Artist</th><th>Charity</th><th>EIN</th><th>Donation</th><th>Note</th><th class="right">Actions</th></tr>
        </thead>
        <tbody id="rows"></tbody>
      </table>
    </div>
  </div>

<script>
  var cache = [];

  function key() {
    return document.getElementById('adminKey').value.trim();
  }

  function setStatus(msg) {
    document.getElementById('status').textContent = msg;
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function api(path, options) {
    var finalOptions = options || {};
    var headers = Object.assign({ 'Content-Type': 'application/json', 'x-admin-key': key() }, finalOptions.headers || {});
    var response = await fetch(path, Object.assign({}, finalOptions, { headers: headers }));
    var payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Request failed');
    return payload;
  }

  function renderRows() {
    var tbody = document.getElementById('rows');
    var filter = document.getElementById('filter').value.toLowerCase().trim();
    var visible = cache.filter(function(entry) {
      if (!filter) return true;
      return (entry.artist_name || '').toLowerCase().includes(filter) || (entry.charity_name || '').toLowerCase().includes(filter);
    });

    document.getElementById('count').textContent = visible.length + ' entries';

    tbody.innerHTML = visible.map(function(entry) {
      return '<tr>' +
        '<td>' + escapeHtml(entry.artist_name) + '</td>' +
        '<td>' + escapeHtml(entry.charity_name) + '</td>' +
        '<td>' + escapeHtml(entry.charity_ein) + '</td>' +
        '<td>$' + Number(entry.suggested_donation_usd || 5).toFixed(2) + '</td>' +
        '<td class="muted">' + escapeHtml(entry.note || '') + '</td>' +
        '<td class="right">' +
          '<button class="secondary" onclick="editMapping(\'' + encodeURIComponent(entry.artist_id) + '\')">Edit</button> ' +
          '<button class="secondary" onclick="deleteMapping(\'' + encodeURIComponent(entry.artist_id) + '\')">Delete</button>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  async function loadMappings() {
    try {
      var payload = await api('/admin/mappings');
      cache = payload.entries || [];
      renderRows();
      setStatus('Loaded ' + cache.length + ' entries.');
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function createMapping() {
    try {
      var body = {
        artist_name: document.getElementById('artist_name').value,
        charity_name: document.getElementById('charity_name').value,
        charity_ein: document.getElementById('charity_ein').value,
        risk_category: document.getElementById('risk_category').value,
        monthly_listeners: document.getElementById('monthly_listeners').value,
        suggested_donation_usd: document.getElementById('suggested_donation_usd').value,
        note: document.getElementById('note').value
      };

      await api('/admin/mappings', { method: 'POST', body: JSON.stringify(body) });
      setStatus('Created mapping.');
      await loadMappings();
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function editMapping(encodedArtistId) {
    var artistId = decodeURIComponent(encodedArtistId);
    var entry = cache.find(function(item) { return item.artist_id === artistId; });
    if (!entry) return;

    var artist_name = prompt('Artist name:', entry.artist_name || '');
    if (artist_name === null) return;
    var charity_name = prompt('Charity name:', entry.charity_name || '');
    if (charity_name === null) return;
    var charity_ein = prompt('Charity EIN:', entry.charity_ein || '');
    if (charity_ein === null) return;
    var suggested_donation_usd = prompt('Suggested donation USD (>=5):', String(entry.suggested_donation_usd || 5));
    if (suggested_donation_usd === null) return;

    try {
      await api('/admin/mappings/' + encodeURIComponent(artistId), {
        method: 'PUT',
        body: JSON.stringify({
          artist_id: entry.artist_id,
          artist_name: artist_name,
          charity_name: charity_name,
          charity_ein: charity_ein,
          risk_category: entry.risk_category,
          monthly_listeners: entry.monthly_listeners,
          note: entry.note,
          suggested_donation_usd: suggested_donation_usd
        })
      });
      setStatus('Updated mapping.');
      await loadMappings();
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function deleteMapping(encodedArtistId) {
    var artistId = decodeURIComponent(encodedArtistId);
    if (!confirm('Delete this mapping?')) return;
    try {
      await api('/admin/mappings/' + encodeURIComponent(artistId), { method: 'DELETE' });
      setStatus('Deleted mapping.');
      await loadMappings();
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function bulkImport() {
    var raw = document.getElementById('bulkCsv').value;
    if (!raw.trim()) {
      setStatus('Paste CSV text first.');
      return;
    }

    try {
      var payload = await api('/admin/import-direct', { method: 'POST', body: JSON.stringify({ rawText: raw }) });
      setStatus('Imported ' + payload.importedCount + ' rows.');
      cache = payload.entries || [];
      renderRows();
    } catch (err) {
      setStatus(err.message);
    }
  }

  function downloadJson() {
    var blob = new Blob([JSON.stringify({ entries: cache }, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'mappings-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>
</body>
</html>`;
}

function handleDirectImport(rawText) {
  const rows = parseDirectMappingRows(rawText);
  if (!rows.length) {
    return { error: 'No importable rows found.' };
  }

  const headers = Object.keys(rows[0]);
  if (!headers.includes('Artist') || !headers.includes('Recommended charity') || !headers.includes('EIN')) {
    return { error: 'Missing required columns: Artist, Recommended charity, EIN' };
  }

  const seen = new Set();
  const entries = rows
    .map((row, idx) => {
      const artistName = row.Artist;
      const charityName = row['Recommended charity'];
      const charityEin = row.EIN;
      if (!artistName || !charityName || !charityEin) return null;

      const key = `${artistName.toLowerCase()}|${String(charityEin).toLowerCase()}`;
      if (seen.has(key)) return null;
      seen.add(key);

      return {
        artist_id: `import-${Date.now()}-${idx + 1}`,
        artist_name: artistName,
        risk_category: 'direct-match',
        charity_name: charityName,
        charity_ein: charityEin,
        monthly_listeners: toNumeric(row['Monthly listeners']),
        note: String(row.Foibles || ''),
        suggested_donation_usd: 5
      };
    })
    .filter(Boolean);

  if (!entries.length) {
    return { error: 'No valid entries after parsing.' };
  }

  return { entries };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    return json(res, 200, { ok: true, service: 'play-it-forward-api' });
  }

  if (req.method === 'GET' && url.pathname === '/admin') {
    return text(res, 200, adminHtml());
  }

  if (url.pathname === '/admin/mappings') {
    if (!requireAdminKey(req, res)) return;

    if (req.method === 'GET') {
      return json(res, 200, readMappings());
    }

    if (req.method === 'POST') {
      try {
        const payload = await parseJsonBody(req);
        const validated = validateEntry(payload);
        if (validated.error) return json(res, 400, { error: validated.error });

        const existing = readMappings().entries || [];
        const next = [validated.entry, ...existing];
        return json(res, 201, writeMappings(next));
      } catch (error) {
        return json(res, 400, { error: error.message });
      }
    }
  }

  if (url.pathname === '/admin/import-direct' && req.method === 'POST') {
    if (!requireAdminKey(req, res)) return;

    try {
      const payload = await parseJsonBody(req);
      const imported = handleDirectImport(payload.rawText);
      if (imported.error) return json(res, 400, { error: imported.error });

      const saved = writeMappings(imported.entries);
      return json(res, 200, { ...saved, importedCount: imported.entries.length });
    } catch (error) {
      return json(res, 400, { error: error.message });
    }
  }

  if (url.pathname.startsWith('/admin/mappings/')) {
    if (!requireAdminKey(req, res)) return;

    const artistId = decodeURIComponent(url.pathname.split('/').pop());
    const existing = readMappings().entries || [];

    if (req.method === 'DELETE') {
      const next = existing.filter(entry => entry.artist_id !== artistId);
      if (next.length === existing.length) {
        return json(res, 404, { error: 'Mapping not found' });
      }

      return json(res, 200, writeMappings(next));
    }

    if (req.method === 'PUT') {
      try {
        const payload = await parseJsonBody(req);
        const validated = validateEntry({ ...payload, artist_id: artistId });
        if (validated.error) return json(res, 400, { error: validated.error });

        let found = false;
        const next = existing.map(entry => {
          if (entry.artist_id === artistId) {
            found = true;
            return validated.entry;
          }

          return entry;
        });

        if (!found) return json(res, 404, { error: 'Mapping not found' });
        return json(res, 200, writeMappings(next));
      } catch (error) {
        return json(res, 400, { error: error.message });
      }
    }
  }

  if (req.method === 'GET' && url.pathname.startsWith('/analysis/')) {
    const userId = url.pathname.split('/').pop();
    const mappings = readMappings().entries || [];
    const top5 = mappings.slice(0, 5).map((entry, index) => ({
      rank: index + 1,
      artistName: entry.artist_name,
      charityName: entry.charity_name,
      suggestedDonationUsd: entry.suggested_donation_usd || 5
    }));

    return json(res, 200, {
      userId,
      overallSuggestedDonationUsd: top5.reduce((sum, row) => sum + Number(row.suggestedDonationUsd || 0), 0),
      topRiskyRecommendations: top5
    });
  }

  if (req.method === 'POST' && url.pathname === '/donations/checkout') {
    try {
      const parsed = await parseJsonBody(req);
      const donationAmount = Number(parsed.amountUsd || 0);
      if (donationAmount < 5) {
        return json(res, 400, { error: 'Minimum donation is $5.00' });
      }

      const roundUp = parsed.roundUpProcessingFees === true;
      const roundUpFee = roundUp ? Number((donationAmount * 0.07).toFixed(2)) : 0;

      return json(res, 200, {
        status: 'ready_for_provider_checkout',
        partner: 'Change',
        amountUsd: donationAmount,
        roundUpProcessingFees: roundUp,
        roundUpFeeUsd: roundUpFee,
        totalUsd: Number((donationAmount + roundUpFee).toFixed(2))
      });
    } catch (error) {
      return json(res, 400, { error: error.message });
    }
  }

  return json(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Play it Forward API listening on port ${PORT}`);
});
