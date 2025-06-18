# Siargao Rides – **Private Van Hire Landing Page** SEO Implementation Plan

> Use this checklist as the single source of truth when updating/creating code. All items are ordered (roughly) top‑down in the file tree and page flow. Tick each box once complete.

---

## 1 ▪ Routing & URL ✅

- [ ] **Create/rename page route** → `/siargao-private-van-hire`  
  └─ `app/siargao-private-van-hire/page.tsx` (copy current `page.tsx` if renaming)
- [ ] Update any internal links/canonical references to use the new slug.

---

## 2 ▪ Head & Metadata 🏷️

_Edit **`page.tsx`** inside the functional component._

```tsx
import Head from 'next/head';
<Head>
  <title>Private Van Hire Siargao – Airport Transfers | Siargao Rides</title>
  <meta name="description" content="Book an air‑conditioned private van from Sayak Airport to General Luna for a fixed ₱2,500. No sharing, pro drivers, instant confirmation." />
  <link rel="canonical" href="https://siargaorides.ph/siargao-private-van-hire" />
  <!-- Open Graph / Twitter -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Private Van Hire Siargao" />
  <meta property="og:description" content="Fixed‑rate airport pick‑ups & island transfers with Siargao Rides." />
  <meta property="og:url" content="https://siargaorides.ph/siargao-private-van-hire" />
</Head>
```

---

## 3 ▪ Hero Section 🚌🌴

- [ ] **H1** → `Private Van Hire in Siargao – Airport Pick‑ups & Island Transfers`
- [ ] Replace hero image with optimised JPG/webp. Use `next/image` & `priority`.
- [ ] `alt="Private van at Sayak Airport"` (include primary keyword once).

---

## 4 ▪ Content Blocks (replace or add components)

| Order | Component / file | Purpose & key copy (H2 text) |
|-------|------------------|------------------------------|
| 1 | `components/WhyBook.tsx` (new) | **Why book a Private Van with Siargao Rides?** – 3–4 bullet features (air‑con, door‑to‑door, insured, fixed rate) |
| 2 | `components/PopularRoutes.tsx` (new) or extend `RouteCard.tsx` | **Popular Routes & Travel Times** – map over list (Airport ↔ GL, Cloud 9, Dapa, Pacifico) |
| 3 | Existing 3‑step section | **How Van Hire Works** (keep, ensure copy uses "private van" keyword) |
| 4 | New simple section | **Transparent Pricing – ₱2,500 All‑in** – emphasise no hidden fees |
| 5 | `components/FAQ.tsx` (new) | FAQ schema compliant, answer long‑tail queries |

---

## 5 ▪ Schema Mark‑up 📄

Insert in **`page.tsx`** (after `<Head>`):

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "Private Van Hire",
      "provider": {
        "@type": "LocalBusiness",
        "name": "Siargao Rides",
        "areaServed": "Siargao"
      },
      "areaServed": "Siargao",
      "offers": {
        "@type": "Offer",
        "priceCurrency": "PHP",
        "price": "2500"
      }
    })
  }}
/>
```

Also add an `FAQPage` schema block inside `FAQ.tsx`.

---

## 6 ▪ UX / CTA upgrades

- [ ] **Sticky mobile bar**: `Book now – ₱2,500` → opens `VanHireBookingForm` modal.
- [ ] Duplicate “Check availability” button after Popular Routes section.

---

## 7 ▪ Internal Links 🔗

Within body copy add:

- Link text **“motorbike rentals”** → `/browse/bikes`
- Link text **“vehicle rental shops”** → `/shops`

---

## 8 ▪ Performance & Accessibility ⚡

- [ ] Use a single SVG sprite for icons (replace multiple small PNG fetches).
- [ ] `next/image` lazy load all non‑hero images.
- [ ] Ensure headings follow logical order (H1 > H2 > H3).
- [ ] Run Lighthouse – aim CLS < 0.1, LCP < 2.5 s.

---

## 9 ▪ Sitemap & Robots

- [ ] Add `/siargao-private-van-hire` to `next-sitemap.config.js`.
- [ ] Verify crawl & index in Google Search Console after deployment.

---

## 10 ▪ Analytics & Monitoring 📊

- [ ] Set up page‑level GSC filter; monitor queries: *siargao van hire*, *siargao airport transfer*.
- [ ] Track CTR; tweak meta description if CTR < 3 % after 4 weeks.

---

## 11 ▪ Content Refresh Cadence

- [ ] Quarterly: update pricing, FAQs, testimonials.
- [ ] Post 2 guest articles on Siargao blogs linking to target URL (anchor "private van hire Siargao").

---

### ✅ DONE WHEN

1. Page passes Lighthouse SEO > 95.
2. Rich‑result test detects *Service* + FAQ schema.
3. GSC shows impressions for primary keyword within 30 days.

---

*Prepared for Claude Code implementation – 18 Jun 2025*

