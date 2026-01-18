# Business Onboarding QA Checklist

## Core flow (new business)
1) Open `/list-your-vehicles`
2) Click “Continue with Google”
3) After auth, land in `/dashboard` as `shop_owner`
4) If no shop exists, confirm Quick Start Onboarding appears
5) Create shop (minimal fields)
6) Confirm redirect to `/dashboard/onboarding/success?step=shop`
7) Click “Add your first vehicle” → lands on `/dashboard/vehicles/add?onboarding=1`
8) Submit with minimum fields (no photos/docs)
9) Confirm redirect to `/dashboard/onboarding/success?step=vehicle`

## Booking disclaimer (unverified)
1) Open an unverified shop/vehicle booking page `/booking/[vehicleId]`
2) Confirm the “Unverified listing” disclaimer appears
3) Try to submit without checking “I understand” → should block submission with an error
4) Check “I understand” and submit → booking should proceed normally

## Regression checks
- Existing tourist signup/signin still works (no intent query)
- Existing Google users with role already set are not overwritten
- Public browse still loads vehicles/shops and shows badges correctly

