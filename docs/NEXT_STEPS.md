# Play it Forward — What to Build Next

This file turns the MVP blueprint into an execution sequence you can follow immediately.

## 0) Immediate objective
Get from planning docs to a clickable production-oriented v1 foundation with:
- iOS-first mobile app shell
- backend API shell
- Spotify auth proof-of-life
- Change donation partner integration stub
- Great Listener + ReTune tab foundation

---

## 1) Phase plan (starting now)

## Phase 1 — Foundation (Day 0–1)
1. Create repo structure:
   - `apps/mobile` (React Native)
   - `apps/api` (Node + TypeScript)
   - `packages/shared` (types/constants)
2. Add environment templates (`.env.example`) for Spotify, Stripe, and donation partner keys.
3. Set up CI checks:
   - lint
   - typecheck
   - test stubs
4. Define first database schema draft for:
   - users
   - spotify_accounts
   - risky_artists
   - charities
   - donations

## Phase 2 — Core flow skeleton (Day 1–3)
1. Mobile screens:
   - Welcome
   - Connect Spotify
   - Consent
   - Analysis Loading
   - Mode chooser (Great Listener vs ReTune)
   - Results (overall + top 5 ReTune)
   - Great Listener tab results
2. API endpoints (stubbed):
   - `POST /auth/spotify/start`
   - `GET /auth/spotify/callback`
   - `GET /analysis/:userId`
   - `POST /donations/checkout`
3. Hardcode sample risky artists + charity mappings for demo.
4. Implement “Ignore artist” user setting.

## Phase 3 — Donation and trust layer (Day 3–5)
1. Wire Change donation flow (one-time first).
2. Add $5 minimum donation validation.
3. Add “Round up to cover processing fees” (+7%) toggle in checkout.
4. Save donation record + receipt metadata.

## Phase 4 — Polishing and launch prep (Day 5–7)
1. Premium UI polish and copy tuning.
2. Share card generation (Listening board + Donation board).
3. Legal copy pass and disclaimers.
4. TestFlight build + smoke testing.

---

## 2) Decision checklist (must finalize before coding deep)
- [x] App name: Play it Forward
- [x] Donation partner: Change
- [ ] Initial 50 risky artist mappings
- [ ] Initial charity catalog (US 501(c)(3) only; constrained by Change availability)
- [x] Min donation: $5
- [x] Final platform fee copy: “Round up to cover processing fees” (+7%: 5% Change, 2% platform)
- [x] Legal disclaimer text and consent text (drafted in MVP blueprint)

---

## 3) Day-1 deliverables for tomorrow review
- One polished mobile prototype flow (8–10 key screens including Light/Dark mode entry).
- One architecture diagram (mobile ↔ API ↔ Spotify/donation providers).
- One recommendation policy one-pager (internal-only rationale, non-defamatory user UI).
- One implementation backlog with priority labels.

---

## 4) Backlog template (copy into project tracker)

## P0 (must-have)
- Spotify OAuth integration
- Listening history fetch + top artist summary
- Risk matching engine v1
- Overall recommendation amount calculation
- Top 5 risky recommendations
- One-time donation checkout via Change
- $5 minimum donation guard
- Round-up 7% toggle
- Receipt history screen

## P1 (should-have)
- Find different charity
- Ignore artist
- Values preference selector
- Join your favorites section

## P2 (nice-to-have)
- Monthly support option
- Share cards to socials
- Extended source-link explainability (internal/admin only)

---

## 5) Definition of done for MVP launch
MVP is launch-ready when all are true:
1. A new user can connect Spotify and finish analysis without manual support.
2. User can choose Great Listener or ReTune mode and view results in each.
3. User can donate in-app in one flow.
4. Receipt is stored and viewable/downloadable.
5. Legal/consent language is present and accepted.
6. App is stable in TestFlight for internal testers.

## 6) TestFlight readiness steps (right now)
1. Build and run the new mobile alpha shell in `apps/mobile` (Welcome → Connect → Consent → Analyze → Mode selection → ReTune/Great Listener → Checkout/History).
2. Point the mobile app to a reachable API URL for device testing (replace `127.0.0.1` with your LAN host when testing on physical iPhone).
3. Create Apple bundle + App Store Connect app record (`com.playitforward.app`) and prep EAS build profile for internal TestFlight.

