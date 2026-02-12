const fs = require('fs');
const path = require('path');

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

function normalizeContent(raw) {
  return raw
    .replace(/\\n/g, '\n')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && line.includes(','))
    .join('\n');
}

function parseCsv(content) {
  const normalized = normalizeContent(content);
  const lines = normalized
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map(header => header.trim());
  const headerSignature = headers.join('|').toLowerCase();

  return lines
    .slice(1)
    .map(line => splitCsvLine(line))
    .filter(values => values.length)
    .filter(values => values.join('|').toLowerCase() !== headerSignature)
    .map(values => {
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] ?? '';
      });
      return row;
    });
}

function hasColumns(rows, columns) {
  if (!rows.length) return false;
  const keys = Object.keys(rows[0]);
  return columns.every(column => keys.includes(column));
}

function requiredColumns(rows, columns, fileLabel) {
  if (!rows.length) {
    throw new Error(`${fileLabel} has no data rows.`);
  }

  const keys = Object.keys(rows[0]);
  const missing = columns.filter(column => !keys.includes(column));
  if (missing.length) {
    throw new Error(`${fileLabel} missing required columns: ${missing.join(', ')}`);
  }
}

function buildEntriesFromPairedCsv(artists, charities) {
  requiredColumns(artists, ['artist_id', 'artist_name', 'risk_category'], 'artists.csv');
  requiredColumns(charities, ['risk_category', 'charity_name', 'ein'], 'charities.csv');

  const charityByCategory = new Map();
  charities.forEach(charity => {
    if (!charityByCategory.has(charity.risk_category)) {
      charityByCategory.set(charity.risk_category, charity);
    }
  });

  return artists
    .map(artist => {
      const charity = charityByCategory.get(artist.risk_category);
      if (!charity) return null;

      return {
        artist_id: artist.artist_id,
        artist_name: artist.artist_name,
        risk_category: artist.risk_category,
        charity_name: charity.charity_name,
        charity_ein: charity.ein,
        suggested_donation_usd: 5
      };
    })
    .filter(Boolean);
}

function toNumeric(input) {
  const parsed = Number(String(input || '').replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function buildEntriesFromDirectCsv(rows) {
  requiredColumns(rows, ['Artist', 'Recommended charity', 'EIN'], 'direct artist-charity CSV');

  const seen = new Set();
  return rows
    .map((row, idx) => {
      const artistName = row.Artist;
      const charityName = row['Recommended charity'];
      const charityEin = row.EIN;

      if (!artistName || !charityName || !charityEin) return null;

      const key = `${artistName.toLowerCase()}|${String(charityEin).toLowerCase()}`;
      if (seen.has(key)) return null;
      seen.add(key);

      return {
        artist_id: `direct-${idx + 1}`,
        artist_name: artistName,
        risk_category: 'direct-match',
        charity_name: charityName,
        charity_ein: charityEin,
        monthly_listeners: toNumeric(row['Monthly listeners']),
        note: row.Foibles || '',
        suggested_donation_usd: 5
      };
    })
    .filter(Boolean);
}

function writeOutput(entries) {
  const outPath = path.resolve('data/mappings.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), entries }, null, 2),
    'utf8'
  );

  console.log(`Wrote ${entries.length} mappings to ${outPath}`);
}

function main() {
  const firstCsv = process.argv[2] || 'data/artists.csv';
  const secondCsv = process.argv[3] || 'data/charities.csv';

  const firstPath = path.resolve(firstCsv);
  const secondPath = path.resolve(secondCsv);

  if (!fs.existsSync(firstPath)) {
    console.error('Could not find CSV files.');
    console.error(`Expected first CSV: ${firstPath}`);
    console.error('Usage: node scripts/import-mappings.js <artists.csv> <charities.csv>');
    console.error('Or use: node scripts/import-mappings.js <direct-artist-charity.csv>');
    process.exit(1);
  }

  const firstRows = parseCsv(fs.readFileSync(firstPath, 'utf8'));

  if (hasColumns(firstRows, ['Artist', 'Recommended charity', 'EIN'])) {
    const entries = buildEntriesFromDirectCsv(firstRows);
    writeOutput(entries);
    return;
  }

  if (!fs.existsSync(secondPath)) {
    console.error('Could not find charities CSV for paired import mode.');
    console.error(`Expected charities CSV: ${secondPath}`);
    console.error('Pass a single direct-mapping CSV with columns: Artist, Recommended charity, EIN');
    process.exit(1);
  }

  const secondRows = parseCsv(fs.readFileSync(secondPath, 'utf8'));
  const entries = buildEntriesFromPairedCsv(firstRows, secondRows);
  writeOutput(entries);
}

main();
