# Firebase fallback path (no Apple $99)

Yes, you can use Firebase **instead of Apple Developer/TestFlight** for a web MVP.

## Important limitation
- Firebase does **not** replace TestFlight or native iOS app distribution.
- Without Apple Developer membership, you cannot ship a native iOS app via TestFlight/App Store.

## What this gives you
- Hosting for a web MVP (`apps/web`)
- API endpoints via Cloud Functions (`firebase/functions/index.js`)
- A fast way to demo core flow without Apple account costs

## Deploy steps
1. Install Firebase CLI:
```bash
npm i -g firebase-tools
firebase login
```

2. Set project ID in `firebase/.firebaserc`.

3. Install function deps:
```bash
cd firebase/functions
npm install
```

4. Deploy hosting + functions:
```bash
cd firebase
firebase deploy
```

## Endpoints (after deploy)
- `GET /api/health`
- `GET /api/analysis/:userId`
- `GET /api/meta/config`
- `GET /api/charities/search`
- `POST /api/donations/checkout`
