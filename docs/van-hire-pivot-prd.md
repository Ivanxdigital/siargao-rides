# PRD: Siargao Rides Pivot to Premium Private Van Hire + Tours (WhatsApp-first)

Date: 2026-01-28  
Owner: Ivan  
Status: Draft  

---

## 1) Overview

**Product name (working):** Siargao Rides — Private Van Hire & Tours  

**Summary:** Pivot the current Siargao Rides marketplace into a premium, WhatsApp-first concierge-style service that connects customers to **private** vans for airport transfers, land tours, and **private** island hopping/tours via a partnered provider. No booking forms and no online checkout initially: all “bookings” begin via WhatsApp for fast quoting and coordination.

**Design constraint:** Keep the **current website theme** (colors, typography, overall vibe) but refine the UI to feel **more modern and premium** (cleaner hierarchy, fewer marketplace elements, premium copy, stronger trust cues).

---

## 2) Background / Context

- The current site is primarily a **vehicle rental marketplace** (browse, book vehicles, shop onboarding).
- For now, the marketplace is on hold; priority is a **higher-touch, higher-margin** service offering aimed at customers who want **private / exclusive** experiences.
- Operationally, WhatsApp enables:
  - faster lead qualification
  - flexible quoting
  - easier exception handling (flight delays, special requests)

**Hard constraint:** We only offer **private** services (no shared shuttles, no joiner tours).

---

## 3) Goals & Success Metrics

### Primary goals
- Increase qualified inquiries via WhatsApp for private van hire and tours.
- Position Siargao Rides as a premium/private option (not shared).
- Reduce friction: “click → WhatsApp → confirm”.

### Success metrics (MVP)
- WhatsApp click-through rate from landing pages.
- Inbound WhatsApp leads per day/week.
- Quote → confirmed booking rate.
- Average revenue per booking (manual tracking OK for MVP).

---

## 4) Stakeholders

- **Product/Operations:** Ivan
- **Service fulfillment:** partnered van/tour provider + drivers
- **Customer support:** WhatsApp operator (initially Ivan)

---

## 5) User Personas

### Primary
- **Foreign tourists (groups/friends/couples):** want convenience, privacy, and reliability; limited patience for coordination.
- **OFWs visiting family:** prefer comfort, time savings, predictable coordination.

### Secondary
- **Local partner agency/driver network:** wants steady demand and clear pickup details.

---

## 6) Offerings (MVP)

### A) Private airport transfer
- **Fixed price:** ₱3,000 one-way **Sayak Airport ↔ General Luna**
- **Everything else:** custom quote (Cloud 9, Pacifico, Santa Monica, etc.)
- **Payment:** cash on pickup / upon driver pickup
- **Re-confirmation policy:** if no reservation fee is collected, customer must re-confirm a few hours before pickup; no reconfirmation → auto-cancel.

### B) All-day private hire / land tour
- **Fixed price (temporary):** ₱8,000 all day
- Details/route: custom via WhatsApp (until partner rate card is finalized).

### C) Tours (via partnered agency)
- **Private island hopping tours** (exclusive boat)
- **Land tours** (north/day trips)
- **Premium framing:** “private & curated”, not “cheap joiner”.
- **Pricing model:** “starting from” ranges on site + quote via WhatsApp.

---

## 7) Core User Flow (No forms)

1. Visitor lands on Home / service page.
2. Visitor sees:
   - what’s offered
   - fixed prices (where applicable)
   - inclusions + trust cues
3. Visitor taps **WhatsApp CTA** (deep link).
4. Pre-filled message asks for:
   - name
   - date/time
   - service type (airport transfer / all-day hire / tour)
   - pickup + dropoff
   - number of passengers
   - luggage / surfboards
   - flight number (if airport)
5. Operator replies with quote and confirmation instructions.

---

## 8) Requirements

### Functional requirements
- WhatsApp CTA present on:
  - header/nav
  - hero
  - pricing sections
  - footer
- WhatsApp deep link uses `+63 999 370 2550` and includes a pre-filled message template.
- Pages include “fixed price” cards for:
  - Airport ↔ General Luna: ₱3,000 one-way
  - All-day private hire: ₱8,000
- Clear policy copy:
  - cash payment
  - reconfirmation rules
  - auto-cancel rules
- Ensure all tour pages/copy are **private-only**:
  - no “shared”, “joiner”, “per-person joiner”, “group tour” language
  - emphasize exclusive/private experience and custom coordination
- Remove (or de-emphasize) marketplace actions from navigation:
  - browse vehicles, booking flows, shop onboarding, dashboards
- Keep Terms/Privacy accessible and accurate for the new service.

### Non-functional requirements
- Mobile-first UX (most WhatsApp conversions are mobile).
- Fast load (image optimization, minimal heavy components on MVP landing pages).
- SEO basics:
  - correct titles/descriptions
  - relevant service schema where appropriate
  - avoid internal competition between legacy marketplace and new service

---

## 9) Information Architecture (MVP)

Recommended primary navigation:
- Home
- Airport Transfer
- Private Van Hire / Land Tour
- Island Hopping & Tours
- Contact (or “WhatsApp”)

Recommended pages:
- `/` Home (premium pitch + service cards + starting prices + FAQs)
- `/airport-transfer-siargao` fixed ₱3,000 GL route + quote for other routes
- `/private-van-hire-siargao` ₱8,000 all-day + common itineraries (examples) + quote CTA
- `/tours-siargao` (new) overview of tours + “starting from” ranges + quote CTA
- `/contact` simple page with WhatsApp + fallback email

Legacy marketplace pages:
- Keep available only on subdomain or hidden behind `/marketplace` (per pivot plan).

---

## 10) Copy / Positioning (Premium cues)

Tone:
- concierge-like, reliable, local expertise
- “private”, “exclusive”, “door-to-door”, “no waiting”

Proof/trust:
- partnered provider mention (“vetted drivers”, “local team”)
- safety & comfort (AC, luggage space, surfboard-friendly)
- simple expectations (response times, reconfirmation policy)

UI guidance (keep current theme, feel more premium):
- Reduce visible “marketplace complexity” on main pages (less data-heavy UI; more curated sections).
- Stronger typographic hierarchy (headline → price → inclusions → CTA).
- Premium microcopy (clarity + confidence; no bargain language).

---

## 11) Analytics (MVP)

Track the main conversion:
- `whatsapp_cta_click` on each page (source page, CTA location)

Manual tracking acceptable initially:
- spreadsheet of inquiries → confirmed → revenue

---

## 12) Risks & Mitigations

- **Price mismatch vs market / partner costs**
  - Mitigation: keep tours as “starting from” and quote-based; update rates after partner rate card is confirmed.
- **No-shows / last-minute cancellations**
  - Mitigation: reconfirmation policy; optionally introduce a reservation fee later.
- **SEO conflict with marketplace**
  - Mitigation: separate subdomain + noindex legacy, or clear canonical/redirect strategy.

---

## 13) Out of Scope (for MVP)

- Online booking forms
- Online payments / deposits
- User accounts / dashboards
- Automated scheduling or dispatch
- Shared shuttles or shared/joiner tours

---

## 14) Acceptance Criteria (MVP)

- Site clearly presents only the new service offerings on main navigation and homepage.
- Every core page has a prominent WhatsApp CTA with a pre-filled message.
- Airport transfer page displays **₱3,000 one-way Airport ↔ General Luna** and “other routes: quote”.
- Private hire page displays **₱8,000 all-day** and “custom itinerary: quote”.
- Tours page exists and lists **private-only** tour types with “starting from” ranges (quote-based).
- Re-confirmation / auto-cancel policy is visible on pages where relevant.
- Legacy marketplace preserved via `marketplace-legacy` branch and separate deployment (per plan).

---

## 15) Appendix: Siargao Tours (quick market scan)

Notes:
- Prices vary by season, inclusions, group size, and whether it’s joiner vs private.
- Use these as **ballpark “starting from”** until partner pricing is confirmed.

Common tours to list (MVP):
- **Tri-island hopping:** Guyam + Daku + Naked Island
- **Sugba Lagoon day trip:** typically Del Carmen area
- **Sohoton Cove day trip**
- **Land/North tour:** Magpupungko + Maasin River + Pacifico + (optional) Tayangban Cave Pool

Indicative pricing ranges (from public listings, Jan 2026 scan):
- Many public listings show **per-person joiner prices**, but Siargao Rides will offer **private-only** tours.
- For MVP site copy, use **quote-based “starting from”** for private tours, and avoid per-person joiner pricing language.
- **Private tour packages** are typically priced per boat/vehicle + fees; best handled as quote-based “starting from” until partner pricing is confirmed.

Sources reviewed (save for reference; verify before final pricing copy):
- https://www.getyourguide.com/siargao-island-l158540/siargao-joiner-island-hopping-tour-with-pickup-optional-t521102/
- https://www.klook.com/activity/120612-siargao-joiner-island-hopping-tour/
- https://www.klook.com/activity/120607-siargao-sohoton-cove-tour/
- https://www.klook.com/activity/120606-siargao-sugba-lagoon-day-tour/
- https://guidetothephilippines.ph/articles/ultimate-guides/siargao-tourist-spots
- https://thesearchingtraveler.com/siargao-tri-island-hopping-tour/
