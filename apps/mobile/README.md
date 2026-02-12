# Play it Forward Mobile (Expo)

This is the iOS-first internal alpha shell for TestFlight prep.

## Screens included
- Welcome
- Connect Spotify (stub)
- Consent
- Analysis loading
- Mode picker (ReTune / Great Listener)
- ReTune results (top 5 + overall recommendation)
- Great Listener screen
- Donation checkout
- Donation history

## Run locally
```bash
cd apps/mobile
cp .env.example .env
npm install
npm run start
```

For iOS simulator:
```bash
npm run ios
```

## API dependency
The app calls the local API at `http://127.0.0.1:4000` for:
- `GET /analysis/demo-user`
- `POST /donations/checkout`

Start API from repo root:
```bash
npm run api:start
```

## TestFlight build setup (EAS)
This repo now includes `apps/mobile/eas.json` with `preview` and `production` iOS build profiles.

### One-time setup
1. Install and log in to Expo/EAS CLI:
```bash
npm i -g eas-cli
expo login
```
2. From `apps/mobile`, configure project/build credentials:
```bash
eas build:configure
```
3. In `apps/mobile/eas.json`, replace `REPLACE_WITH_ASC_APP_ID` with your App Store Connect app ID.

### Build for internal TestFlight testing
```bash
cd apps/mobile
npm run build:ios:preview
```

### Build + submit for production TestFlight/App Store track
```bash
cd apps/mobile
npm run build:ios:production
npm run submit:ios:production
```

## Notes
- Keep `ios.bundleIdentifier` in `app.json` aligned with the App Store Connect record.
- Set `EXPO_PUBLIC_API_BASE_URL` in `.env` for simulator/device access.
- For real device testing on local network, use your LAN host IP (for example `http://192.168.1.50:4000`).


## Spotify OAuth callback testing
- App scheme is set to `playitforward` in `app.json`.
- API returns `authorizeUrl` from `POST /auth/spotify/start`.
- For manual alpha tests, paste callback URLs into the Connect screen and tap **Process callback URL**.

- API `.env` must include `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and `SPOTIFY_REDIRECT_URI` to support code exchange.


## Owner-configured OAuth redirect
Current Spotify redirect target for this release train: `https://patryancarroll.bubbleapps.io/version-test/listening_history`.

- Do not commit real private IPs in repo files; keep device IP settings only in local `.env`.
