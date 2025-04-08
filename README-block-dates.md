# Block Dates Feature

This feature allows shop owners to block off specific dates when their vehicles are unavailable for booking online, such as:
- When a vehicle is booked via walk-in and not through the platform
- When a vehicle is undergoing maintenance 
- Any other reason the vehicle shouldn't be available for booking

## Implementation

### 1. Database Changes

A new `vehicle_blocked_dates` table has been added with the following schema:

```sql
CREATE TABLE IF NOT EXISTS vehicle_blocked_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (vehicle_id, date)
);
```

The `check_vehicle_availability` function has been updated to also check for blocked dates:

```sql
CREATE OR REPLACE FUNCTION check_vehicle_availability(
  vehicle_id UUID,
  start_date DATE,
  end_date DATE
) RETURNS BOOLEAN AS $$
DECLARE
  booking_count INTEGER;
  blocked_count INTEGER;
BEGIN
  -- Check for overlapping bookings
  SELECT COUNT(*) INTO booking_count
  FROM rentals
  WHERE 
    rentals.vehicle_id = $1
    AND status IN ('pending', 'confirmed')
    AND (
      (start_date <= $2 AND end_date >= $2) OR
      (start_date <= $3 AND end_date >= $3) OR
      (start_date >= $2 AND end_date <= $3)
    );
  
  -- Check for blocked dates within the range
  SELECT COUNT(*) INTO blocked_count
  FROM vehicle_blocked_dates
  WHERE 
    vehicle_blocked_dates.vehicle_id = $1
    AND date >= $2
    AND date <= $3;
  
  -- Vehicle is available if there are no bookings AND no blocked dates
  RETURN booking_count = 0 AND blocked_count = 0;
END;
$$ LANGUAGE plpgsql;
```

### 2. New Components

#### BlockDatesModal.tsx

A new modal component that allows shop owners to:
- View currently blocked dates for a vehicle
- Select multiple dates to block
- Specify a reason for blocking (e.g., walk-in booking, maintenance)
- Save the blocked dates to the database

#### Bookings Calendar Integration

The bookings calendar page has been updated to:
- Show blocked dates on the calendar with a distinct red color
- Add a "Block Dates" button that opens the modal
- Allow shop owners to select a vehicle and block dates for it
- Refresh the calendar when new dates are blocked

### 3. API Updates

The availability checking API has been updated to consider blocked dates when determining if a vehicle is available for booking.

## How to Use

1. Go to the Bookings Calendar page
2. Select a specific vehicle from the filter options
3. Click the "Block Dates" button
4. Use the calendar to select dates you want to block
5. Choose a reason from the dropdown
6. Click "Block Selected Dates" to save

## Benefits

- Prevents double bookings by marking dates as unavailable
- Provides better visibility of vehicle schedules
- Integrates with the existing availability checking system
- Shows blocked dates clearly on the calendar with a different color

## Technical Notes

- Blocked dates are stored separately from bookings for clear separation of concerns
- The calendar view shows both bookings and blocked dates with different styling
- The availability check API has been updated to check both the rentals table and the blocked dates table 