# Build Roadmap for AI Agent
This roadmap outlines the step-by-step flow to build the Siargao Motorbike Rental Directory frontend using React, TailwindCSS, and Framer Motion.

---

## 🧱 Phase 1: Project Initialization

1. Set up a new project using:
   - Next.js (App Router)
   - TailwindCSS
   - ShadCN UI (for clean components)
   - Framer Motion (for animations)
2. Apply a **dark, modern, tropical, minimal** theme
3. Create a base layout file with:
   - Navbar
   - Footer
   - Page wrapper with consistent padding and container sizes

---

## 📄 Phase 2: Page & Route Structure

Create the following pages:

- `/` → Homepage
- `/browse` → Browse Listings
- `/shop/[shopId]` → Shop Profile Page
- `/register` → Register a Shop
- `/add-bike` → Add/Edit Bike Listing (for shop owners)
- `/booking-confirmation` → Booking Confirmation Page (optional modal route)

---

## 🧩 Phase 3: Core UI Components (see ui-components.md)

Build the reusable components:
- Navbar, Footer
- SearchBar
- RentalShopCard
- BikeCard
- ReviewCard
- FilterSidebar
- BookingForm
- Modals
- Buttons, Badges, MapEmbed

Ensure all components are responsive and optimized for mobile-first design.

---

## 🔍 Phase 4: Homepage Logic

- Build Airbnb-style search form:
  - Location input
  - Dates needed
  - Budget slider
  - Bike type dropdown
- Below: Show featured rental shops (use dummy data or mock API)
  - Shop name
  - Images of 1–2 bikes
  - Average price
  - Rating

---

## 📊 Phase 5: Browse Listings Page

- Show all shops by default
- Activate filters (sidebar or modal on mobile) after search
- Implement sorting by price, distance, rating

---

## 🏪 Phase 6: Shop Profile Page

- Show shop name, contact info, map embed
- List of bikes (bike cards)
  - Multiple photos per bike
  - Daily/weekly/monthly price
  - Availability badge
- User reviews at the bottom

---

## 🧾 Phase 7: Registration & Listing Flow

- Build Register Shop form with:
  - Inputs for shop/owner info
  - File upload fields for Gov ID + Business Permit
- Build Add Bike form with:
  - Images, model name, prices
  - Availability toggle

---

## 🛒 Phase 8: Booking System (Frontend Only)

- Allow users to:
  - Choose a bike
  - Select date(s)
  - Choose payment method (Online or Cash on Arrival)
  - Submit booking
- After booking:
  - Show confirmation screen with booking summary
  - OR redirect to WhatsApp/contact link if selected

---

## ✅ Phase 9: Micro Animations

- Add Framer Motion animations for:
  - Buttons (tap/hover)
  - Card hovers
  - Modal transitions
  - Page fade-in/fade-out

---

## 🧪 Phase 10: Final Polish & Testing

- Mobile testing
- Responsive fixes
- Code cleanup
- Prepare for backend/API wiring later

---

## Optional Next Steps
- Connect to Supabase for real-time listings
- Add Stripe or PayMongo for payments
- Enable multi-location support (for expansion)

