# Surf School Integration Plan

## Executive Summary

This document outlines the technical implementation plan for integrating surf school listings and bookings into the existing Siargao Rides platform. The analysis shows that 90% of the current rental shop infrastructure can be reused, requiring minimal backend changes while adding surf-specific frontend features.

## Current Architecture Analysis

### Existing Components That Can Be Reused

| Component | Current Use | Surf School Adaptation |
|-----------|-------------|----------------------|
| `RentalShopCard` | Vehicle shop listings | Direct reuse for surf schools |
| `VehicleCard` | Vehicle listings | Template for `SurfLessonCard` |
| Shop registration flow | Vehicle shop onboarding | Add surf-specific fields |
| Booking system | Date-based rentals | Adapt for time-slot bookings |
| Review system | Shop/vehicle reviews | Direct reuse |
| Payment integration | Rental payments | Direct reuse |

### Key Technical Findings

1. **Shop-Based Architecture**: The platform uses a flexible shop model that can accommodate different service types without architectural changes.

2. **Multi-Vehicle Type Support**: The system already handles multiple vehicle types (motorcycle, car, tuktuk) using a `VehicleType` enum that can be extended.

3. **Component Reusability**: 
   - Browse page filtering system can handle surf schools
   - Shop listing cards work perfectly for surf schools
   - Registration flow needs minimal modifications

4. **Database Schema**: The existing `rental_shops` table structure supports surf schools with minor additions.

## MVP Implementation Plan

### Phase 1: Basic Surf School Listings (Week 1-2)

#### Frontend Components
- [ ] Extend `VehicleType` to include `'surf_lesson'`
- [ ] Create `SurfLessonCard` component (based on `VehicleCard`)
- [ ] Add surf school filter to browse page
- [ ] Update shop registration to include surf school type

#### Backend Changes
- [ ] Add `'surf_school'` as shop type
- [ ] Create `surf_lessons` table (similar to `vehicles`)
- [ ] Add lesson-specific fields (duration, skill_level, max_participants)

#### Key Features
- Surf schools can list basic lesson packages
- Customers can browse surf schools and lessons
- Basic contact/WhatsApp integration

### Phase 2: Time-Based Booking System (Week 3-4)

#### Frontend Components
- [ ] Time slot picker component
- [ ] Lesson availability calendar
- [ ] Booking flow for surf lessons
- [ ] Instructor profiles within shops

#### Backend Changes
- [ ] Time-based availability system
- [ ] Lesson booking table
- [ ] Instructor management

#### Key Features
- Hourly/daily lesson bookings
- Instructor assignment
- Equipment package add-ons

### Phase 3: Advanced Management (Week 5-6)

#### Frontend Components
- [ ] Surf school dashboard
- [ ] Lesson package builder
- [ ] Student management interface
- [ ] Advanced analytics

#### Backend Changes
- [ ] Package pricing system
- [ ] Student progress tracking
- [ ] Advanced reporting

#### Key Features
- Multi-lesson packages
- Student progress tracking
- Seasonal pricing

## Technical Implementation Details

### Database Schema Extensions

```sql
-- Add surf lesson type to vehicles table
ALTER TABLE vehicles 
ADD COLUMN lesson_duration INTEGER, -- in minutes
ADD COLUMN skill_level VARCHAR(20), -- beginner, intermediate, advanced
ADD COLUMN max_participants INTEGER,
ADD COLUMN equipment_included BOOLEAN DEFAULT false,
ADD COLUMN instructor_id VARCHAR;

-- Create instructors table
CREATE TABLE instructors (
  id VARCHAR PRIMARY KEY,
  shop_id VARCHAR REFERENCES rental_shops(id),
  name VARCHAR NOT NULL,
  bio TEXT,
  experience_years INTEGER,
  specialties TEXT[],
  avatar_url VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create lesson bookings table (extends rentals)
CREATE TABLE lesson_bookings (
  id VARCHAR PRIMARY KEY,
  lesson_id VARCHAR REFERENCES vehicles(id),
  instructor_id VARCHAR REFERENCES instructors(id),
  user_id VARCHAR REFERENCES users(id),
  shop_id VARCHAR REFERENCES rental_shops(id),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  participant_count INTEGER DEFAULT 1,
  total_price DECIMAL(10,2),
  equipment_rental BOOLEAN DEFAULT false,
  equipment_fee DECIMAL(10,2),
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Component Architecture

#### SurfLessonCard Component
```typescript
interface SurfLessonCardProps {
  id: string;
  name: string;
  description?: string;
  duration: number; // minutes
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  maxParticipants: number;
  pricePerSession: number;
  equipmentIncluded: boolean;
  images: string[];
  instructor?: {
    name: string;
    experience: number;
    avatar?: string;
  };
  shop: {
    id: string;
    name: string;
    location?: string;
    logo?: string;
  };
  availableSlots?: TimeSlot[];
  onBookClick: (lessonId: string) => void;
}
```

#### Time Slot Picker Component
```typescript
interface TimeSlotPickerProps {
  selectedDate: Date;
  availableSlots: TimeSlot[];
  onSlotSelect: (slot: TimeSlot) => void;
  lessonDuration: number;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  instructorName?: string;
}
```

### API Endpoints

#### Surf School Endpoints
```typescript
// GET /api/surf-schools
// GET /api/surf-schools/[id]
// POST /api/surf-schools (registration)
// PUT /api/surf-schools/[id]

// GET /api/surf-lessons
// GET /api/surf-lessons/[id]
// POST /api/surf-lessons
// PUT /api/surf-lessons/[id]

// GET /api/surf-lessons/[id]/availability
// POST /api/surf-lessons/[id]/book
// GET /api/bookings/surf-lessons
```

### Filter Extensions

#### Browse Page Filters
```typescript
interface BrowseFilters {
  // Existing filters
  vehicleType?: VehicleType | 'all';
  
  // New surf-specific filters
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'all';
  lessonDuration?: 'short' | 'medium' | 'long' | 'all'; // <2h, 2-4h, >4h
  equipmentIncluded?: boolean;
  maxParticipants?: number;
  availableToday?: boolean;
}
```

## Migration Strategy

### Phase 1: Backend Preparation
1. Add surf school types to existing enums
2. Create instructor and lesson booking tables
3. Extend rental shops table with surf-specific fields
4. Add API endpoints for surf school management

### Phase 2: Frontend Integration
1. Update type definitions
2. Create surf lesson components
3. Extend browse page with surf filters
4. Add time-based booking flow

### Phase 3: Shop Owner Tools
1. Surf school registration flow
2. Lesson management dashboard
3. Instructor profile management
4. Booking calendar interface

## Success Metrics

### Technical Metrics
- [ ] All existing vehicle rental functionality remains intact
- [ ] Surf school listings load within 2 seconds
- [ ] Time slot booking flow completes in <30 seconds
- [ ] Mobile responsive design score >90%

### Business Metrics
- [ ] 50+ surf schools registered in first month
- [ ] 200+ lesson bookings in first month
- [ ] <5% booking cancellation rate
- [ ] 4.5+ average rating for surf schools

## Risk Assessment

### Technical Risks
1. **Database Performance**: Adding lesson bookings may impact query performance
   - *Mitigation*: Implement proper indexing and query optimization

2. **Time Zone Handling**: Lesson bookings require precise time management
   - *Mitigation*: Use UTC timestamps with timezone conversion

3. **Concurrent Booking**: Multiple users booking same time slot
   - *Mitigation*: Implement proper database locking

### Business Risks
1. **User Confusion**: Mixing vehicle rentals with surf lessons
   - *Mitigation*: Clear UI separation and filtering

2. **Seasonal Demand**: Surf lessons may be highly seasonal
   - *Mitigation*: Flexible pricing and availability management

## Future Enhancements

### Advanced Features (Post-MVP)
- Multi-day surf packages
- Equipment rental marketplace
- Surf condition integration
- Group booking discounts
- Loyalty program integration
- Mobile app push notifications for bookings

### Integration Opportunities
- Weather API for surf conditions
- Social media sharing for lessons
- Video lesson previews
- Certification tracking
- Tournament organization

## Implementation Checklist

### Frontend Tasks
- [ ] Extend VehicleType enum
- [ ] Create SurfLessonCard component
- [ ] Build TimeSlotPicker component
- [ ] Add surf school filters to browse page
- [ ] Create surf lesson booking flow
- [ ] Add instructor profile components
- [ ] Create surf school dashboard
- [ ] Update shop registration for surf schools
- [ ] Add surf lesson search functionality
- [ ] Implement lesson package builder

### Backend Tasks
- [ ] Create database migrations
- [ ] Add surf school API endpoints
- [ ] Implement time-based availability system
- [ ] Create instructor management system
- [ ] Add lesson booking logic
- [ ] Implement equipment rental tracking
- [ ] Add surf school analytics
- [ ] Create admin tools for surf schools
- [ ] Add email notifications for bookings
- [ ] Implement payment integration for lessons

### Testing & Quality Assurance
- [ ] Unit tests for new components
- [ ] Integration tests for booking flow
- [ ] Performance testing with lesson data
- [ ] Mobile responsiveness testing
- [ ] User acceptance testing with surf schools
- [ ] Load testing for concurrent bookings
- [ ] Security testing for payment flow

## Conclusion

The existing Siargao Rides platform provides an excellent foundation for surf school integration. The shop-based architecture, flexible vehicle type system, and robust booking infrastructure can be extended to support surf schools with minimal risk to existing functionality.

The three-phase approach ensures gradual rollout while maintaining platform stability. The estimated development time is 6 weeks for complete implementation, with basic surf school listings available in just 2 weeks.

The technical implementation leverages existing patterns and components, ensuring consistency with the current platform while adding the specialized functionality needed for surf school operations.