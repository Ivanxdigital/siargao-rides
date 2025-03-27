# Features & Pages

## 1. Homepage
- Search & filter section (Airbnb-style UX)
  - User inputs:
    - Current location or hotel
    - Dates they need the motorbike
    - Daily budget
    - Bike type (e.g., scooter, semi-auto, dirt bike)
- Below the search, show **featured rental shops**:
  - Shop name
  - Preview images of their available bikes
  - Average price range
  - Shop rating (user reviews)

## 2. Browse Listings Page
- Displays **all rental shops** by default
- Filters become active once the user submits search
- Filters include:
  - Price range
  - Bike type
  - Rating
  - Distance from user’s location
- Shops are shown as **cards**, each with:
  - Shop name
  - Preview of 2–3 bikes
  - Starting price
  - Ratings
  - “View Shop” button

## 3. Shop Profile Page
- Shop name, profile photo/banner
- Full contact info (WhatsApp, phone, email)
- Embedded **Google Map location**
- User-generated reviews (text + star rating)
- List of motorbikes:
  - Multiple photos
  - Bike model/type
  - Daily, weekly, monthly rates
  - Status (Available / Rented)

## 4. Register Page (For Shop Owners)
- Fields:
  - Full name
  - Shop name
  - Email address
  - Phone number
  - Upload Government-issued ID (for verification)
  - Upload Business/Municipal Permit (optional but encouraged)
- Once submitted, shop is marked as "Pending Verification"

## 5. Add/Edit Listing Page (For Shop Owners)
- Add new motorbike listing:
  - Bike model/name
  - Upload multiple images
  - Price: Daily, Weekly, Monthly
  - Availability toggle: Available / Not Available
- Edit or delete existing listings

## 6. Booking / Inquiry System
- Two options:
  1. **In-App Booking**
     - User chooses bike and booking date
     - Select payment method: 
       - Pay online
       - Pay in person
     - Booking confirmation screen shown after
  2. **External Inquiry**
     - Direct link to WhatsApp or Call/SMS button
     - Quick contact without booking

## 7. Future-Ready Notes
- Entire system should be built in a modular way to expand to:
  - More locations (e.g., other islands)
  - More vehicle types (e.g., e-bikes, cars)
  - Stripe/Supabase integration for payment + real-time availability
