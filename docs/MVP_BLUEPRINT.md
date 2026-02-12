# Play it Forward — MVP Blueprint (iOS-first, production-grade)

## 1) Product positioning

### Working one-liner
**Keep the songs. Play it Forward.**

### Brand tone
- Premium visual design.
- Fun, inviting, and a little snarky.
- Keep language neutral and non-defamatory in-app.

### Audience and success criteria (Month 1)
- Primary target: Millennials (with optional Gen Z spillover).
- Product type: Consumer app only.
- Success threshold:
  - 10 Spotify connections.
  - 1 completed donation.

---

## 2) Core user experience

## Entry choice (first screen)
Prompt users with two paths:
1. **Great Listener (Light Mode)** — positive alignment with top “good” artists and related causes.
2. **ReTune (Dark Mode)** — top 5 risky listens with charity actions.

## Primary flow
1. **Connect Spotify** (OAuth).
2. **Consent screen** for Spotify and donation data processing.
3. **Analyze listening history**.
4. **Values selection step** (issues user cares about).
5. **Results screen** with:
   - One **overall recommendation** (single most relevant charity + recommended amount).
   - **Top 5 risky listens** with one charity suggestion each.
   - Highlight if a risky artist appears in user’s overall top-5 artists.
   - Suggested donation amount beside each recommendation.
6. **Donate in-app** (one-time default), optional monthly support toggle.
7. **Receipt + donation history** (download/email tax receipt).
8. **Shareables** for socials:
   - Listening board.
   - Donation board.

## Light/Dark UX behavior
- **Light Mode (Great Listener tab):** positive artists + “join your favorites” cause matching.
- **Dark Mode (ReTune tab):** risky artists and balancing donation recommendations.
- Dark Mode uses a visually darker theme to reinforce context.

## User controls
- “Find a different charity” for each recommendation (still constrained to relevant category).
- “Ignore this artist” to remove artist from future recommendations.

---

## 3) Recommendation logic (v1)

## Inputs
- Spotify top artists/tracks + recent listening behavior.
- Internal risk catalog (editorial list of artists and issue categories, reviewed by founder).
- Charity catalog sourced from Change-platform availability and US 501(c)(3) validation.

## Risk scoring
For each risky artist in listening history:
- Compute listening volume proxy (play count or weighted stream count).
- Rank risky artists by volume.
- Display top 5.

## Donation recommendation
- Baseline heuristic: **$0.10 per risky listen**.
- Minimum donation: **$5**.
- Show:
  - Per-artist recommendation.
  - Overall combined recommendation.
- Allow user edits before checkout.

## User-facing content rules
- Do **not** explain why an artist is risky in-app.
- Show artist name + charity recommendation + donation CTA only.
- Avoid explicit allegation language in UI.

---

## 4) Donations and payments

## Processor strategy
Use **Change** as the donation partner with Stripe rails where needed, so Play it Forward is not the regulated payment processor.

## Transaction model
- One-time donation default.
- Optional monthly support toggle.
- Donation minimum: **$5**.
- Checkout add-on copy: **“Round up to cover processing fees”**.
- Round-up add-on: **+7% total**
  - 5% to Change.
  - 2% platform revenue to Play it Forward.

## Receipts and records
- Automatic tax receipt from donation infrastructure/charity partner.
- Save receipts in Donation History.
- Optional emailed copy when user provides email.

---

## 5) Compliance and trust guardrails

- Launch geography: US first.
- Charity scope: only valid US 501(c)(3) organizations available through Change.
- Mandatory consent for Spotify data processing.
- Legal counsel review before launch.
- In-app language avoids defamatory phrasing and accusation detail.

### Draft legal disclaimer text (in-app)
“Play it Forward provides cause-based donation suggestions generated from listening activity and internal category mappings. Suggestions are informational and philanthropic in nature, are not factual findings about any individual, and may be updated at any time. Charity availability and tax treatment are determined by participating nonprofit and donation-platform rules. Please review charity details before donating.”

### Draft data consent text (in-app)
“By connecting Spotify, you authorize Play it Forward to access and process your Spotify listening data (including top artists, tracks, and listening activity) to generate personalized charity recommendations, donation amounts, and shareable summaries. You may disconnect Spotify and manage data preferences at any time in Settings.”

---

## 6) Information architecture

## Main tabs (recommended)
1. **Home** — Mode chooser and overall recommendation.
2. **Great Listener** — light mode; positive artist/cause alignment.
3. **ReTune** — dark mode; top 5 risky listens + donation suggestions.
4. **History** — donations, receipts, shareables.
5. **Profile** — connected accounts, consent, ignored artists, settings.

---

## 7) Technical blueprint (production-grade day 1)

## Mobile
- iOS first with React Native (Android expansion path retained).
- Design system supports themed Light/Dark experience by tab context.

## Backend
- Node.js + TypeScript API.
- PostgreSQL for users, mappings, donations metadata.
- Redis (optional) for caching/recommendation jobs.

## Integrations
- Spotify OAuth + listening endpoints.
- Change donation API + Stripe where required.
- Email provider for receipts/notifications.
- Analytics (Amplitude/PostHog).

## Admin tooling (required even for MVP)
- Internal dashboard for:
  - Risk artist list management.
  - Charity mappings by category.
  - Audit log of edits.

---

## 8) Data model (high-level)

- `users`
- `spotify_accounts`
- `listening_events` (or aggregated snapshots)
- `risky_artists`
- `risk_categories`
- `charities`
- `artist_charity_mappings`
- `good_artist_charity_mappings`
- `user_ignored_artists`
- `donations`
- `tax_receipts`

---

## 9) Delivery plan

## Review-ready (tomorrow)
- Brand direction board with **Play it Forward** naming locked.
- Clickable prototype with Light/Dark entry and both tabs.
- Donation fee UX mock showing 7% round-up toggle.
- Legal disclaimer and consent copy integrated in onboarding screens.

## End-of-next-week launch target (very aggressive)
- Scope only:
  - Spotify connect.
  - Analysis + top 5 risky list.
  - Great Listener positive tab.
  - One overall recommendation.
  - One donation checkout path via Change.
  - Receipt capture/history.
  - Share card generation.

---

## 10) Decisions now locked

1. App name: **Play it Forward**.
2. Donation partner: **Change**.
3. Minimum donation: **$5**.
4. Fee copy: **“Round up to cover processing fees” (+7%).**
5. Legal disclaimer text: draft included above.
6. Consent text: draft included above.

## Still needed
- Initial 50 risky artist mappings (internal editorial list + founder review).
- Initial charity catalog from Change platform availability.

---

## 11) Suggested copy style (examples)

- “Keep the songs. Play it Forward.”
- “Your listening, your impact.”
- “Good mode or ReTune mode?”
- “Round up and keep the impact flowing.”
