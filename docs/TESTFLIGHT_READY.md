# TestFlight Readiness Runbook (Play it Forward)

## Decisions locked from product owner
- App name: **Play it Forward**
- Version: **0.1.0**
- Build lane: **Build + submit pipeline**
- API target for mobile testing: `http://<your-private-lan-ip>:4000`
- Spotify Client ID: configured out-of-repo in API env
- Spotify Redirect URI: `https://patryancarroll.bubbleapps.io/version-test/listening_history`
- Token exchange mode: **real token exchange enabled**
- Internal tester emails: ready

## Hard blocker currently
You do **not** have Apple Developer/App Store Connect dev access yet. Build+submit cannot complete until access is granted.

## What can be done now (already prepared in repo)
1. EAS build profiles are configured in `apps/mobile/eas.json`.
2. Mobile app has OAuth start/callback/token-exchange flow scaffolding.
3. API has `/auth/spotify/start`, `/auth/spotify/callback`, and `/auth/spotify/exchange`.
4. Env templates include required Spotify and API config fields.

## Exact next actions (once access is granted)
1. Apple account access
   - Add your build operator account to Apple Developer + App Store Connect.
   - Create/confirm app record for bundle `com.playitforward.app`.
   - Collect `ascAppId` and replace placeholder in `apps/mobile/eas.json`.
2. Local env setup (never commit secrets)
   - `apps/api/.env`: set `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`.
   - `apps/mobile/.env`: set `EXPO_PUBLIC_API_BASE_URL=http://<your-private-lan-ip>:4000` (local only).
3. Build + submit
   - `cd apps/mobile`
   - `npm run build:ios:production`
   - `npm run submit:ios:production`
4. Assign internal testers in App Store Connect and distribute build.

## Security note
Spotify client secret must remain in local secret storage / CI secrets, not in git.


## Alternative no-Apple path (active now)
If Apple Developer access is unavailable, deploy the Firebase web MVP:
- `firebase/` for Hosting + Functions
- `apps/web/` for UI
This path lets you validate product flow without native iOS/TestFlight distribution costs.


## Screenshot reliability
For reliable screenshots in this environment, use a public preview URL (Vercel preview) instead of localhost/LAN addresses.
