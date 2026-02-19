# CSV Import for Artist → Charity Mappings

If CSV upload is unavailable in your chat UI, this repo now supports **three** import modes:

1. **Paired CSV mode** (`artists.csv` + `charities.csv`)  
2. **Direct mapping CSV mode** (single file with `Artist, Recommended charity, EIN`)  
3. **Pasted text mode** (raw text that includes literal `\n` separators, like chat paste output)

The importer always generates `data/mappings.json` for the API.

## 1) Paired CSV mode (legacy)

### `artists.csv` required columns
- `artist_id`
- `artist_name`
- `risk_category`

### `charities.csv` required columns
- `risk_category`
- `charity_name`
- `ein`

Run:
```bash
npm run import:mappings -- ./artists.csv ./charities.csv
```

## 2) Direct mapping CSV mode (single file)

If you already have rows like this, use one file only:

```csv
Artist,Monthly listeners,Foibles,Recommended charity,EIN
Kanye West,69009987,...,Anti-Defamation League (anti-hate/education),13-1818724
```

Run:
```bash
npm run import:mappings -- ./my-direct-mappings.csv
```

## 3) Pasted text mode (chat-friendly)

If your data includes literal `\n` between rows, place it in:
- `data/bad-bois.pasted.txt`

Then run:
```bash
npm run import:mappings:badbois
```

The importer will:
- convert literal `\n` to real newlines,
- ignore duplicate header rows,
- de-duplicate repeated artist+EIN rows,
- write normalized output to `data/mappings.json`.

## 4) Local template fallback

```bash
cp data/artists.template.csv data/artists.csv
cp data/charities.template.csv data/charities.csv
npm run import:mappings:local
```
