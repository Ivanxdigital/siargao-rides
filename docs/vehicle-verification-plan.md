# Vehicle Verification Implementation Plan

## Summary of Final Result

The final implementation will add a document verification system for vehicles, similar to how shop verification currently works. Vehicle owners (shop owners) can upload vehicles with required documentation, but these vehicles will remain in a "pending" state and won't be visible to customers until an admin has reviewed and verified the documents. This ensures all vehicles on the platform are legitimate and have the required documentation.

Key user flows:
1. **Shop owner**: Uploads a new vehicle with required documents → Views vehicle with "pending verification" status → Gets notified when vehicle is approved or rejected
2. **Admin**: Views list of pending vehicle verifications → Reviews vehicle details and documents → Approves or rejects with optional feedback
3. **Renter/Customer**: Only sees vehicles that have been verified by admins

## Implementation Progress Tracker

### Phase 1: Database Changes and Backend APIs
- [x] Create SQL for database schema changes (`vehicle-verification-schema.sql`)
- [x] Fix SQL for database schema (updated RLS policy to use raw_user_meta_data for role checks)
- [x] Update database schema:
  - [x] Add `is_verified` boolean column to vehicles table
  - [x] Add `verification_status` column to vehicles table
  - [x] Add `verification_notes` column to vehicles table
  - [x] Add `documents` JSONB column to vehicles table
  - [x] Add `verified_at` timestamp column to vehicles table
  - [x] Add `verified_by` UUID column to vehicles table
- [x] Create/update API endpoints:
  - [x] Update `/api/vehicles` POST endpoint to handle documents
  - [x] Create new `/api/vehicles/verify` PATCH endpoint

### Phase 2: Add Vehicle Form Updates
- [x] Add document upload section to form:
  - [x] Vehicle registration document upload field
  - [x] Insurance document upload field
  - [x] Additional documents upload field (optional)
- [x] Add verification process notice for shop owners
- [x] Update form submission to handle document uploads
- [x] Add error handling for document uploads

### Phase 3: Admin Verification Dashboard
- [x] Create admin vehicle verification page with:
  - [x] Tab navigation (Pending/Verified)
  - [x] Vehicle details display
  - [x] Document preview component
  - [x] Approve/Reject buttons
  - [x] Notes/feedback field for rejections
- [x] Implement approval/rejection logic
- [x] Handle admin notifications

### Phase 4: Vehicle Listing Updates
- [x] Update shop owner's vehicle dashboard:
  - [x] Add verification status badges
  - [x] Add verification status filtering
  - [x] Display rejection notes when applicable
- [x] Update public vehicle listings:
  - [x] Filter out unverified vehicles from search results
  - [x] Filter out unverified vehicles from shop pages
  - [x] Filter out unverified vehicles from featured listings

### Additional Enhancements (Optional)
- [ ] Implement notification system:
  - [ ] Email notifications for status changes
  - [ ] In-app notifications for shop owners
- [ ] Add analytics for verification process
- [ ] Create bulk verification options for admins

## Implementation Plan

### 1. Database Changes

Add the following fields to the `vehicles` table:

```sql
ALTER TABLE vehicles
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verification_status VARCHAR(255) DEFAULT 'pending',
ADD COLUMN verification_notes TEXT,
ADD COLUMN documents JSONB,
ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN verified_by UUID REFERENCES auth.users(id);
```

The `documents` JSONB field will store an array of document objects:
```json
[
  {
    "type": "registration",
    "url": "https://...",
    "uploaded_at": "2023-06-15T12:00:00Z"
  },
  {
    "type": "insurance",
    "url": "https://...",
    "uploaded_at": "2023-06-15T12:01:00Z"
  }
]
```

### 2. Frontend Changes

#### A. Update "Add Vehicle" Page (`/dashboard/vehicles/add/page.tsx`)

- Add a new "Documents" section to the form:
  - Vehicle registration document upload (required)
  - Insurance document upload (required)
  - Any other supporting documents (optional)
- Store document URLs with proper document type identifiers
- Add a notice explaining the verification process
- Update form submission to handle document uploads

#### B. Vehicle Dashboard Updates (`/dashboard/vehicles/page.tsx`)

- Add "Pending Verification" badge to unverified vehicles
- Add verification status filtering options
- Include any rejection notes if applicable

#### C. Create Admin Verification Page (`/dashboard/admin/vehicles/verification/page.tsx`)

Create a page similar to the existing shop verification page:
- Tab navigation for "Pending" and "Verified" vehicles
- Cards showing vehicle details, including owner information
- Document preview functionality
- Approve/Reject buttons with optional feedback field

#### D. Public Listings

- Update queries to filter out unverified vehicles from all public facing listings
- Only show verified vehicles to customers

### 3. API Endpoints

#### A. Update `/api/vehicles` POST Endpoint

- Modify to handle document uploads
- Set default `is_verified: false` for new vehicles
- Store document URLs in the proper format

#### B. Create `/api/vehicles/verify` PATCH Endpoint

```typescript
// Request body:
{
  vehicleId: string;
  approve: boolean;
  notes?: string;
}

// Response:
{
  success: boolean;
  message: string;
}
```

### 4. Reuse Components

- Reuse the `DocumentPreview` component from the shop verification page
- Modify it to support vehicle document types (registration, insurance, etc.)
- Implement consistent UI patterns for verification processes

### 5. Notifications (optional, future enhancement)

- Send email notification to shop owner when their vehicle is approved/rejected
- Add in-app notification for verification status changes

## Implementation Phases

### Phase 1: Database Changes and Backend APIs
- Update database schema
- Create/update API endpoints for vehicle CRUD with verification

### Phase 2: Add Vehicle Form Updates
- Update the add vehicle form with document upload functionality
- Implement proper storage and linking of documents to vehicles

### Phase 3: Admin Verification Dashboard
- Create the admin verification dashboard for vehicles
- Implement document review and approval/rejection flow

### Phase 4: Vehicle Listing Updates
- Update vehicle listing pages to filter by verification status
- Add UI elements to show verification status to shop owners

## Security Considerations

- Ensure document storage has proper access controls
- Implement validation for document types and file formats
- Sanitize all user inputs for document metadata

## Testing Strategy

1. Test vehicle creation with document uploads
2. Test admin approval and rejection flows
3. Test document preview functionality
4. Verify unverified vehicles aren't shown to customers
5. Ensure shop owners can see their pending vehicles 