# Screenshot capture guide (for this repo)

## Why localhost screenshots may fail
The browser-tool runtime and shell runtime can be network-isolated in CI-like environments.
That can cause `ERR_EMPTY_RESPONSE` for `127.0.0.1`/LAN URLs even when local curl works.

## Reliable approach
1. Push branch changes.
2. Wait for Vercel preview deployment.
3. Use the public preview URL from:
   - PR comment (`🔗 Vercel Preview ready: ...`)
   - GitHub Actions run summary
4. Capture screenshots against that public URL.

## Security
- Avoid pasting private LAN IPs in committed files.
- Keep local network values in untracked `.env` only.
