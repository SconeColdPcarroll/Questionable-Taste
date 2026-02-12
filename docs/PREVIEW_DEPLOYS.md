# Branch/PR Preview Deploys

This repo is wired for **Vercel Preview Deployments** using GitHub Actions.

## What you get
- Every non-`main` push gets a preview deployment.
- Every PR gets a preview deployment and a PR comment with a clickable URL.
- Manual trigger support via GitHub Actions `workflow_dispatch`.
- The preview URL is also written to the GitHub Actions run summary.
- The preview serves `apps/web` as a production-like static deployment.

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
- Missing secret failures are explicit at workflow start.
- Ensure branch is not `main` or trigger manually using workflow_dispatch.
- If previews stop posting on PR, verify `pull-requests: write` permission on workflow.


See `docs/SCREENSHOTS.md` for reliable screenshot capture workflow.
