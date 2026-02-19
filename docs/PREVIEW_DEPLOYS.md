# Branch/PR Preview Deploys

This repo is wired for **Vercel Preview Deployments** using GitHub Actions.

## What you get
- Every non-`main` push gets a preview deployment.
- Every PR gets a preview deployment and a PR comment with a clickable URL.
- Manual trigger support via GitHub Actions `workflow_dispatch`.
- The preview URL is also written to the GitHub Actions run summary.
- The preview deploy is run directly by Vercel CLI from repo source (no `--prebuilt` output required).

## Files
- `.github/workflows/vercel-preview.yml`
- `vercel.json`

## One-time setup (GitHub repo settings)
Add these repository secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## How to connect project in Vercel
1. Create/import this repo in Vercel.
2. Copy project/org IDs from Vercel project settings.
3. Generate a Vercel token (Account Settings → Tokens).
4. Add all 3 values to GitHub Actions secrets.

## Where to click the preview URL
1. PR comment: look for `🔗 Vercel Preview ready: ...`
2. Actions run summary: open the latest "Vercel Preview Deploy" run.
3. Vercel dashboard deployments list.

## Security notes
- Never commit Vercel token values in code or docs.
- If a token is pasted in chat/logs, rotate it in Vercel and update the GitHub secret.

## Troubleshooting
- If Spotify login redirects to another domain (for example Bubble), your `SPOTIFY_REDIRECT_URI` is pointing off-preview; remove it or set it to your Vercel callback URL. The API now auto-falls back to `https://<current-host>/api/spotify/callback` when hosts mismatch.
- If Vercel errors with `No Output Directory named "public" found`, ensure `buildCommand` runs successfully (`node scripts/vercel-build.js`) so `apps/web` is copied into `public/` during build.
- Vercel previews now intentionally skip `npm install` because this project's deployed web preview + API routes use Node built-ins only; this avoids workspace/mobile install failures in CI.
- If Spotify connect returns `upstream connect error ... connection refused`, make sure your Vercel project **Root Directory is the repo root** and that `vercel.json` does **not** set a static-only `outputDirectory` that disables `/api/*` serverless functions.
- Missing secret failures are explicit at workflow start.
- Ensure branch is not `main` or trigger manually using workflow_dispatch.
- If previews stop posting on PR, verify `pull-requests: write` permission on workflow.


See `docs/SCREENSHOTS.md` for reliable screenshot capture workflow.


## Fix applied for your merge blocker
If you saw `Config file was not found at ".vercel/output/config.json"`, this workflow now avoids `--prebuilt` mode and uses a normal `vercel deploy --yes`, which resolves that error.


## Spotify in preview links (real account connect)
Add these Vercel project environment variables:
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REDIRECT_URI`
- `SPOTIFY_STATE_SECRET` (any random long secret)

Then whitelist `SPOTIFY_REDIRECT_URI` in your Spotify app settings.
The web preview now uses:
- `GET /api/spotify/start`
- `GET /api/spotify/callback`
- `GET /api/spotify/me`

If you need this to work across every preview URL, use one stable callback domain and include `return_to` in start flow (already implemented).
