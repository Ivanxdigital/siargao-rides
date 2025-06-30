# Vehicle Grouping Feature Implementation Plan

## Executive Summary

This document outlines the implementation plan for introducing a vehicle grouping feature to Siargao Rides. The feature will allow shop owners to create and manage groups of identical vehicles (e.g., 5 Honda Click 125i scooters) while maintaining individual vehicle tracking for operational purposes.

## Table of Contents

1. [Current System Overview](#current-system-overview)
2. [Problem Statement](#problem-statement)
3. [Proposed Solution](#proposed-solution)
4. [Implementation Phases](#implementation-phases)
5. [Technical Specifications](#technical-specifications)
6. [User Education & Guidance Strategy](#user-education--guidance-strategy)
7. [Timeline](#timeline)
8. [Migration Strategy](#migration-strategy)
9. [Future Enhancements](#future-enhancements)

## Current System Overview

### Architecture
- **Database Model**: Each vehicle is a unique record in the `vehicles` table
- **Availability**: Binary per vehicle (available/not available)
- **Booking System**: One-to-one relationship between rentals and vehicles
- **Conflict Prevention**: Database-level exclusion constraints prevent double bookings

### Key Components
```
vehicles (table)
├── id (UUID) - Unique identifier
├── shop_id - Links to rental shop
├── name - Vehicle name/model
├── is_available - Boolean flag
├── price_per_day/week/month - Pricing tiers
└── verification_status - Admin verification

rentals (table)
├── vehicle_id - Links to specific vehicle
├── start_date/end_date - Booking period
└── status - Booking status

vehicle_blocked_dates (table)
└── Manual date blocking per vehicle
```

### Current Workflow
1. Shop owner adds each vehicle individually
2. Each vehicle appears as a separate listing
3. Customers see all individual vehicles
4. Bookings are made against specific vehicles

### Limitations
- **Redundant Listings**: 5 identical scooters = 5 separate listings
- **Management Overhead**: Updating 5 vehicles for price changes
- **Poor UX**: Customers see cluttered search results
- **No Inventory View**: Can't see "3 of 5 available" at a glance

## Problem Statement

Shop owners with multiple identical vehicles face:
- Time-consuming vehicle entry process
- Difficult bulk management (pricing, availability)
- Cluttered customer-facing listings
- No consolidated inventory view

Customers experience:
- Confusion seeing duplicate listings
- Difficulty understanding total availability
- Overwhelming browse experience for popular models

## Proposed Solution

### Smart Grouping System

A dual-layer approach that provides:

**Customer View (Frontend)**
- Grouped display: "Honda Click 125i (4 available)"
- Clean, consolidated listings
- Quantity-aware availability calendar
- Streamlined booking experience

**Operations View (Backend)**
- Individual vehicle tracking maintained
- Specific unit assignment on booking
- Per-vehicle maintenance history
- Flexible grouping/ungrouping

### Key Features

1. **Batch Vehicle Creation**
   - Add multiple identical vehicles at once
   - Auto-generate individual identifiers
   - Share common attributes (images, specs, pricing)

2. **Group Management**
   - Toggle between grouped/individual view
   - Bulk operations (pricing, availability)
   - Group-level analytics

3. **Smart Availability**
   - Show quantity available per date
   - Color-coded calendar (all/some/none available)
   - Automatic unit assignment

## Implementation Phases

### Phase 1: Database Foundation (Week 1)

#### 1.1 Schema Updates

**New Tables:**
```sql
-- Vehicle groups for managing collections
CREATE TABLE vehicle_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES rental_shops(id),
  name TEXT NOT NULL,
  base_vehicle_id UUID REFERENCES vehicles(id),
  vehicle_type_id UUID NOT NULL REFERENCES vehicle_types(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  total_quantity INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_shop FOREIGN KEY (shop_id) 
    REFERENCES rental_shops(id) ON DELETE CASCADE,
  INDEX idx_shop_groups (shop_id, is_active)
);

-- Group settings for customization
CREATE TABLE vehicle_group_settings (
  group_id UUID PRIMARY KEY REFERENCES vehicle_groups(id),
  auto_assign_strategy TEXT DEFAULT 'sequential',
  naming_pattern TEXT DEFAULT 'Unit {index}',
  share_images BOOLEAN DEFAULT TRUE,
  share_pricing BOOLEAN DEFAULT TRUE,
  share_specifications BOOLEAN DEFAULT TRUE
);
```

**Table Modifications:**
```sql
-- Add grouping support to vehicles
ALTER TABLE vehicles 
ADD COLUMN group_id UUID REFERENCES vehicle_groups(id),
ADD COLUMN group_index INTEGER,
ADD COLUMN individual_identifier TEXT,
ADD COLUMN is_group_primary BOOLEAN DEFAULT FALSE;

-- Ensure unique group positions
ALTER TABLE vehicles 
ADD CONSTRAINT unique_group_position 
  UNIQUE (group_id, group_index) 
  WHERE group_id IS NOT NULL;

-- Index for group queries
CREATE INDEX idx_vehicle_groups ON vehicles(group_id) 
  WHERE group_id IS NOT NULL;
```

#### 1.2 Views and Functions

**Availability View:**
```sql
CREATE VIEW vehicle_group_availability AS
WITH availability_counts AS (
  SELECT 
    vg.id as group_id,
    COUNT(DISTINCT v.id) FILTER (WHERE v.is_available = true) as total_available,
    COUNT(DISTINCT v.id) as total_vehicles,
    ARRAY_AGG(
      DISTINCT jsonb_build_object(
        'vehicle_id', v.id,
        'identifier', v.individual_identifier,
        'is_available', v.is_available
      ) ORDER BY v.group_index
    ) as vehicles
  FROM vehicle_groups vg
  LEFT JOIN vehicles v ON v.group_id = vg.id
  GROUP BY vg.id
)
SELECT 
  vg.*,
  ac.total_available,
  ac.total_vehicles,
  ac.vehicles,
  v.price_per_day,
  v.price_per_week,
  v.price_per_month,
  v.images,
  v.specifications
FROM vehicle_groups vg
JOIN availability_counts ac ON ac.group_id = vg.id
LEFT JOIN vehicles v ON v.id = vg.base_vehicle_id;
```

**Group Availability Check:**
```sql
CREATE OR REPLACE FUNCTION check_group_availability(
  p_group_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  available_count INTEGER,
  total_count INTEGER,
  available_vehicles UUID[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER FILTER (
      WHERE NOT EXISTS (
        SELECT 1 FROM rentals r
        WHERE r.vehicle_id = v.id
        AND r.status IN ('pending', 'confirmed')
        AND daterange(p_start_date, p_end_date, '[]') && 
            daterange(r.start_date::DATE, r.end_date::DATE, '[]')
      )
    ) as available_count,
    COUNT(*)::INTEGER as total_count,
    ARRAY_AGG(v.id) FILTER (
      WHERE NOT EXISTS (
        SELECT 1 FROM rentals r
        WHERE r.vehicle_id = v.id
        AND r.status IN ('pending', 'confirmed')
        AND daterange(p_start_date, p_end_date, '[]') && 
            daterange(r.start_date::DATE, r.end_date::DATE, '[]')
      )
    ) as available_vehicles
  FROM vehicles v
  WHERE v.group_id = p_group_id
  AND v.is_available = true;
END;
$$ LANGUAGE plpgsql;
```

### Phase 2: Backend API Development (Week 2)

#### 2.1 New API Endpoints

**Vehicle Group Management:**
```typescript
// POST /api/vehicle-groups
interface CreateVehicleGroupRequest {
  name: string;
  vehicle_type_id: string;
  category_id: string;
  quantity: number;
  base_vehicle_data: {
    description?: string;
    price_per_day: number;
    price_per_week?: number;
    price_per_month?: number;
    specifications: Record<string, any>;
    images: VehicleImage[];
    documents?: VehicleDocument[];
  };
  naming_pattern?: string; // e.g., "Unit {index}", "{name} #{index}"
  individual_names?: string[]; // Optional custom names
}

// GET /api/vehicle-groups/[shopId]
// Returns all groups for a shop with availability counts

// PUT /api/vehicle-groups/[groupId]
// Update group settings and bulk update vehicles

// POST /api/vehicle-groups/[groupId]/bulk-action
interface BulkActionRequest {
  action: 'set-availability' | 'update-pricing' | 'block-dates';
  vehicle_ids?: string[]; // Optional: specific vehicles, otherwise all
  data: Record<string, any>;
}

// GET /api/vehicle-groups/[groupId]/availability
interface GroupAvailabilityRequest {
  start_date: string;
  end_date: string;
}
```

#### 2.2 Updated Vehicle APIs

**Enhanced Vehicle Creation:**
```typescript
// POST /api/vehicles (updated)
interface CreateVehicleRequest {
  // ... existing fields
  create_as_group?: boolean;
  quantity?: number;
  naming_pattern?: string;
  individual_names?: string[];
}

// Response includes group_id if created as group
```

**Browse API Updates:**
```typescript
// GET /api/vehicles/browse (updated)
interface BrowseResponse {
  vehicles: Array<{
    id: string;
    name: string;
    // ... existing fields
    is_group?: boolean;
    group_id?: string;
    available_count?: number;
    total_count?: number;
  }>;
}
```

#### 2.3 Service Layer Updates

**VehicleGroupService:**
```typescript
// src/lib/services/vehicleGroupService.ts
export class VehicleGroupService {
  async createGroup(data: CreateVehicleGroupRequest): Promise<VehicleGroup> {
    // 1. Create vehicle group record
    // 2. Create individual vehicle records
    // 3. Link vehicles to group
    // 4. Copy base vehicle data to all
  }

  async getGroupAvailability(
    groupId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<GroupAvailability> {
    // Query available vehicles in date range
    // Return count and available vehicle IDs
  }

  async assignVehicleFromGroup(
    groupId: string,
    rentalData: CreateRentalData
  ): Promise<string> {
    // 1. Get available vehicles in group
    // 2. Apply assignment strategy
    // 3. Return selected vehicle ID
  }

  async bulkUpdateGroup(
    groupId: string,
    updates: Partial<VehicleData>
  ): Promise<void> {
    // Update all vehicles in group
    // Respect group settings (share pricing, etc.)
  }
}
```

### Phase 3: Shop Dashboard UI (Week 3)

#### 3.1 Vehicle Management Page Updates

**Group Toggle View:**
```typescript
// src/app/dashboard/vehicles/page.tsx
- Add "View as Groups" toggle button
- Implement GroupedVehicleCard component
- Show "5 units (3 available)" status
- Add expand/collapse for group details
```

**Batch Creation Flow:**
```typescript
// src/app/dashboard/vehicles/add/page.tsx updates
- Add "Create Multiple" checkbox
- Show quantity input when checked
- Add naming pattern selector
- Option for custom unit names
- Single image upload for all units
```

#### 3.2 New Components

**GroupedVehicleCard:**
```typescript
// src/components/dashboard/GroupedVehicleCard.tsx
interface GroupedVehicleCardProps {
  group: VehicleGroup;
  onExpand: () => void;
  onBulkAction: (action: BulkAction) => void;
}

// Features:
- Availability badge (3/5 available)
- Bulk actions dropdown
- Expand to show individual units
- Quick edit group settings
```

**VehicleGroupManager:**
```typescript
// src/components/dashboard/VehicleGroupManager.tsx
// Modal for managing group settings
- Update naming pattern
- Bulk pricing changes
- Availability management
- Group/ungroup vehicles
```

### Phase 4: Customer-Facing Updates (Week 4)

#### 4.1 Browse Page Enhancements

**Updated VehicleCard:**
```typescript
// src/components/VehicleCard.tsx
- Add availability count badge
- Show "Multiple units available"
- Group indicator icon
- Modified click behavior for groups
```

**Search and Filter Updates:**
```typescript
// src/app/(main)/browse/page.tsx
- Update filters to handle groups
- Aggregate grouped vehicles in results
- Sort by total availability
```

#### 4.2 Booking Flow Updates

**Vehicle Selection for Groups:**
```typescript
// src/components/BookingForm.tsx
- Add unit selection step for groups
- Show available units dropdown
- Display unit identifiers
- Real-time availability updates
```

**Enhanced Calendar:**
```typescript
// src/components/DateRangePicker.tsx
- Color coding for partial availability
- Tooltip showing "2 of 5 available"
- Updated availability checking
```

### Phase 5: Testing and Optimization (Week 5)

#### 5.1 Testing Strategy

**Unit Tests:**
- Group creation and management
- Availability calculations
- Assignment algorithms
- API endpoints

**Integration Tests:**
- Full booking flow with groups
- Bulk operations
- Migration scenarios
- Edge cases (last unit, conflicts)

**Performance Tests:**
- Large group queries
- Browse page with many groups
- Availability checking optimization

#### 5.2 Performance Optimizations

**Database Indexes:**
```sql
-- Optimize group queries
CREATE INDEX idx_vehicle_group_shop ON vehicle_groups(shop_id, is_active);
CREATE INDEX idx_vehicle_group_lookup ON vehicles(group_id, is_available);
CREATE INDEX idx_rental_vehicle_status ON rentals(vehicle_id, status);
```

**Query Optimization:**
- Batch availability checks
- Cached group counts
- Optimized browse queries

## Technical Specifications

### Data Models

**VehicleGroup:**
```typescript
interface VehicleGroup {
  id: string;
  shop_id: string;
  name: string;
  base_vehicle_id: string;
  vehicle_type_id: string;
  category_id: string;
  total_quantity: number;
  is_active: boolean;
  settings: VehicleGroupSettings;
  created_at: Date;
  updated_at: Date;
}

interface VehicleGroupSettings {
  auto_assign_strategy: 'sequential' | 'random' | 'least_used';
  naming_pattern: string;
  share_images: boolean;
  share_pricing: boolean;
  share_specifications: boolean;
}
```

**Enhanced Vehicle Model:**
```typescript
interface Vehicle {
  // ... existing fields
  group_id?: string;
  group_index?: number;
  individual_identifier?: string;
  is_group_primary?: boolean;
}
```

### API Contracts

**Group Creation Response:**
```typescript
interface CreateGroupResponse {
  group: VehicleGroup;
  vehicles: Vehicle[];
  success: boolean;
  message?: string;
}
```

**Group Availability Response:**
```typescript
interface GroupAvailabilityResponse {
  group_id: string;
  start_date: string;
  end_date: string;
  total_vehicles: number;
  available_count: number;
  available_vehicles: Array<{
    id: string;
    identifier: string;
    next_available_date?: string;
  }>;
}
```

## User Education & Guidance Strategy

### Overview

Making the vehicle grouping feature intuitive for non-tech-savvy users is critical for adoption. This section outlines comprehensive user education strategies, tooltip systems, and visual guidance to ensure both shop owners and customers can easily understand and use the new features.

### Target User Groups

#### 1. Shop Owners
- **Tech Literacy**: Varies from basic to intermediate
- **Primary Concerns**: Time efficiency, avoiding mistakes, understanding benefits
- **Key Actions**: Creating groups, managing inventory, bulk operations

#### 2. Customers
- **Tech Literacy**: Wide range, many non-tech-savvy tourists
- **Primary Concerns**: Understanding availability, booking the right vehicle
- **Key Actions**: Browsing grouped vehicles, understanding "X of Y available"

### Visual Design Language

#### Iconography System
```typescript
// Consistent icon usage across the platform
const GroupingIcons = {
  singleVehicle: '🏍️',      // Individual vehicle
  vehicleGroup: '🏍️📦',     // Grouped vehicles
  availability: '✅',         // Available
  partialAvailability: '🟡', // Some available
  unavailable: '❌',         // None available
  groupIndicator: '🔢',      // Quantity indicator
  helpTip: 'ℹ️',            // Information/help
  success: '✨',            // Success feedback
};
```

#### Color Coding
- **Green**: All units available
- **Yellow/Amber**: Some units available
- **Red**: No units available
- **Blue**: Informational hints
- **Purple**: New feature indicators

### Tooltip & Hint System

#### 1. Smart Tooltip Component
```typescript
// src/components/ui/SmartTooltip.tsx
interface SmartTooltipProps {
  content: string;
  showOnFirstVisit?: boolean;
  dismissible?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  icon?: ReactNode;
  learnMoreUrl?: string;
}

// Features:
- Auto-show for first-time users
- Dismissible with "Don't show again"
- Mobile-friendly positioning
- Simple, clear language
- Optional "Learn more" links
```

#### 2. Contextual Help Triggers
```typescript
// Tooltip content examples
const TooltipContent = {
  // Shop Owner Tooltips
  groupCreation: {
    title: "Save Time with Groups!",
    content: "Have multiple identical vehicles? Create them all at once! Example: 5 Honda Click scooters = 1 group with 5 units.",
    icon: "💡",
    learnMoreUrl: "/help/vehicle-groups"
  },
  
  bulkOperations: {
    title: "Update All at Once",
    content: "Change prices or availability for all vehicles in this group with one click.",
    icon: "⚡"
  },
  
  namingPattern: {
    title: "How Units Are Named",
    content: "Choose how to identify each unit. Examples:\n• 'Unit 1, Unit 2...'\n• 'Honda #1, Honda #2...'\n• Custom names you choose",
    icon: "🏷️"
  },
  
  // Customer Tooltips
  availabilityBadge: {
    title: "Multiple Units Available",
    content: "This shop has 3 identical Honda Clicks. You can book any available unit!",
    icon: "🎯"
  },
  
  partialAvailability: {
    title: "Limited Availability",
    content: "Only 2 of 5 units are available for your selected dates. Book soon!",
    icon: "⏰"
  }
};
```

### Onboarding Flows

#### 1. Shop Owner Onboarding

**First Group Creation Tutorial:**
```typescript
// src/components/onboarding/GroupCreationTutorial.tsx
const GroupCreationSteps = [
  {
    step: 1,
    title: "Welcome to Vehicle Groups!",
    content: "Let's save you time by creating multiple identical vehicles at once.",
    visual: <AnimatedGroupingDemo />,
    action: "Next"
  },
  {
    step: 2,
    title: "How Many Vehicles?",
    content: "Enter the number of identical vehicles you have. For example: 5 Honda Clicks.",
    highlight: "#quantity-input",
    action: "Got it!"
  },
  {
    step: 3,
    title: "Name Your Units",
    content: "Choose how to identify each unit. We'll suggest 'Unit 1, Unit 2...' but you can customize!",
    highlight: "#naming-pattern",
    action: "Continue"
  },
  {
    step: 4,
    title: "One Setup for All",
    content: "Add photos, set prices, and enter details once - they'll apply to all units!",
    visual: <SharedSettingsDemo />,
    action: "Start Creating"
  }
];
```

**Interactive Demo Mode:**
- "Try it first" sandbox environment
- No real data created
- Step-by-step guidance
- Mistake-friendly with undo options

#### 2. Customer Onboarding

**Browse Page Education:**
```typescript
// First-time visitor sees this
const CustomerEducationBanner = () => (
  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
    <div className="flex items-start">
      <InfoIcon className="text-blue-400 mt-1" />
      <div className="ml-3">
        <p className="text-sm font-medium text-blue-800">
          New: Some vehicles show availability like "3 of 5 available"
        </p>
        <p className="text-sm text-blue-700 mt-1">
          This means the shop has multiple identical vehicles. You can book any available unit!
          <button className="ml-2 text-blue-600 underline text-sm">
            Learn more
          </button>
        </p>
      </div>
      <button className="ml-auto text-blue-400 hover:text-blue-600">
        <XIcon size={20} />
      </button>
    </div>
  </div>
);
```

### In-Context Education

#### 1. Progressive Disclosure

**Shop Dashboard:**
```typescript
// Collapsed view (default)
<GroupedVehicleCard>
  <div className="flex items-center justify-between p-4">
    <div className="flex items-center gap-3">
      <Badge>5 units</Badge>
      <h3>Honda Click 125i</h3>
      <Tooltip content="This is a vehicle group with 5 identical units">
        <InfoIcon size={16} />
      </Tooltip>
    </div>
    <ChevronDown />
  </div>
</GroupedVehicleCard>

// Expanded view (on click)
<GroupedVehicleCard expanded>
  {/* Individual units shown with tutorial hints */}
  <div className="p-4 bg-gray-50">
    <p className="text-sm text-gray-600 mb-3">
      💡 Tip: You can manage all units together or individually
    </p>
    {/* Unit list */}
  </div>
</GroupedVehicleCard>
```

#### 2. Empty States as Teachers

**No Groups Yet:**
```typescript
const EmptyGroupsState = () => (
  <div className="text-center py-12 border-2 border-dashed rounded-lg">
    <GroupIcon className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-lg font-medium">No Vehicle Groups Yet</h3>
    <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
      Have multiple identical vehicles? Save time by creating them as a group!
    </p>
    <div className="mt-6">
      <Button onClick={startGroupCreation}>
        <Plus className="mr-2" />
        Create Your First Group
      </Button>
    </div>
    <div className="mt-4">
      <button className="text-sm text-primary hover:underline">
        Watch 2-minute tutorial
      </button>
    </div>
  </div>
);
```

### Visual Indicators

#### 1. Availability Visualization

**Calendar Enhancement:**
```typescript
// Date cell rendering with group availability
const DateCell = ({ date, groupAvailability }) => {
  const { available, total } = groupAvailability;
  
  return (
    <div className="relative">
      {/* Color-coded background */}
      <div className={cn(
        "p-2 rounded",
        available === total && "bg-green-100",
        available > 0 && available < total && "bg-yellow-100",
        available === 0 && "bg-red-100"
      )}>
        {date.getDate()}
      </div>
      
      {/* Availability indicator */}
      {total > 1 && (
        <div className="absolute bottom-1 right-1 text-xs">
          <Tooltip content={`${available} of ${total} units available`}>
            <span className="font-medium">
              {available}/{total}
            </span>
          </Tooltip>
        </div>
      )}
    </div>
  );
};
```

#### 2. Browse Page Cards

**Enhanced Vehicle Card:**
```typescript
const VehicleCard = ({ vehicle, isGroup }) => (
  <div className="relative">
    {/* Group indicator badge */}
    {isGroup && (
      <div className="absolute top-2 right-2 z-10">
        <Badge 
          variant="secondary" 
          className="bg-purple-100 text-purple-800"
        >
          <Users size={14} className="mr-1" />
          {vehicle.available_count} available
        </Badge>
      </div>
    )}
    
    {/* Hover state explanation */}
    {isGroup && (
      <div className="absolute inset-0 bg-black/80 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center p-4">
        <div className="text-white text-center">
          <Users className="mx-auto mb-2" size={32} />
          <p className="text-sm font-medium">Multiple Units Available</p>
          <p className="text-xs mt-1">
            This shop has {vehicle.total_count} identical {vehicle.name}s.
            {vehicle.available_count} are available for your dates.
          </p>
        </div>
      </div>
    )}
    
    {/* Regular card content */}
  </div>
);
```

### Help Documentation

#### 1. In-App Help Center

**Help Topics Structure:**
```
/help
├── /vehicle-groups
│   ├── what-are-groups
│   ├── creating-your-first-group
│   ├── managing-group-inventory
│   └── converting-existing-vehicles
├── /customer-guide
│   ├── understanding-availability
│   ├── booking-grouped-vehicles
│   └── faq
└── /video-tutorials
    ├── shop-owner-guide (3 min)
    └── customer-guide (1 min)
```

#### 2. FAQ Integration

**Common Questions:**
```typescript
const GroupingFAQs = [
  {
    question: "What does '3 of 5 available' mean?",
    answer: "The shop has 5 identical vehicles of this type. 3 are available for your selected dates. You'll be assigned one when you book.",
    category: "customer"
  },
  {
    question: "Should I group my vehicles?",
    answer: "Group identical vehicles (same model, year, features). Don't group if vehicles have different conditions, colors, or features customers care about.",
    category: "shop_owner"
  },
  {
    question: "Can I manage units individually?",
    answer: "Yes! Even in a group, you can set individual units as unavailable for maintenance or update specific details.",
    category: "shop_owner"
  }
];
```

### Mobile Considerations

#### Touch-Friendly Help
- Larger tap targets for help icons (44x44px minimum)
- Bottom sheet modals instead of tooltips on mobile
- Swipe-through tutorials
- Simplified language for smaller screens

#### Mobile-Specific Components
```typescript
// Mobile help drawer
const MobileHelpDrawer = () => (
  <BottomSheet>
    <div className="p-4">
      <h3 className="font-medium mb-3">Quick Help</h3>
      <div className="space-y-3">
        {contextualHelp.map(item => (
          <TouchableOpacity key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
            <item.icon className="text-primary mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-xs text-gray-600 mt-1">{item.content}</p>
            </div>
          </TouchableOpacity>
        ))}
      </div>
    </div>
  </BottomSheet>
);
```

### Success Feedback

#### Positive Reinforcement
```typescript
// After creating first group
const SuccessMessage = () => (
  <Alert className="bg-green-50 border-green-200">
    <CheckCircle className="text-green-600" />
    <AlertTitle>Great job! You created your first vehicle group 🎉</AlertTitle>
    <AlertDescription>
      You just saved time by creating 5 vehicles at once. You can now manage them 
      all together or individually as needed.
    </AlertDescription>
  </Alert>
);
```

### Continuous Improvement

#### Analytics Integration
- Track tooltip dismissals
- Monitor help article views
- Measure time to first successful group creation
- A/B test different educational approaches

#### Feedback Collection
```typescript
// Post-action feedback
const QuickFeedback = () => (
  <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4">
    <p className="text-sm mb-2">Was this feature helpful?</p>
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={() => recordFeedback('yes')}>
        👍 Yes
      </Button>
      <Button size="sm" variant="outline" onClick={() => recordFeedback('no')}>
        👎 No
      </Button>
    </div>
  </div>
);
```

### Implementation Priority

1. **High Priority (Launch)**
   - Basic tooltips on key actions
   - Availability badges and indicators
   - Simple FAQ section
   - Empty state education

2. **Medium Priority (Post-Launch)**
   - Interactive tutorials
   - Video guides
   - Advanced tooltips with dismissal
   - Mobile-optimized help

3. **Low Priority (Future)**
   - AI-powered help chat
   - Personalized tips based on usage
   - Gamification elements
   - Multi-language support

## Timeline

### Week 1: Database Foundation
- Day 1-2: Schema design and migration scripts
- Day 3-4: Database functions and views
- Day 5: Testing and rollback procedures

### Week 2: Backend Development
- Day 1-2: Vehicle group APIs
- Day 3-4: Service layer implementation
- Day 5: API testing and documentation

### Week 3: Shop Dashboard
- Day 1-2: UI components for groups
- Day 3-4: Batch creation flow
- Day 5: Dashboard integration testing

### Week 4: Customer Experience
- Day 1-2: Browse page updates
- Day 3-4: Booking flow enhancements
- Day 5: End-to-end testing

### Week 5: Launch Preparation
- Day 1-2: Performance optimization
- Day 3: Migration tools and scripts
- Day 4: Documentation and training
- Day 5: Staged rollout planning

## Migration Strategy

### Existing Vehicles

**Auto-Detection:**
```sql
-- Find potential groups (same name, shop, type)
WITH potential_groups AS (
  SELECT 
    shop_id,
    name,
    vehicle_type_id,
    category_id,
    COUNT(*) as vehicle_count
  FROM vehicles
  WHERE group_id IS NULL
  GROUP BY shop_id, name, vehicle_type_id, category_id
  HAVING COUNT(*) > 1
)
SELECT * FROM potential_groups;
```

**Migration Tool:**
- Identify identical vehicles
- Suggest grouping to shop owners
- One-click group creation
- Preserve all existing data

### Rollback Plan

**Phase 1: Soft Launch**
- Feature flag for group functionality
- Selected shops for beta testing
- Monitor performance and feedback

**Phase 2: Gradual Rollout**
- Enable for all shops
- Keep individual vehicle flow as fallback
- A/B testing for customer experience

**Emergency Rollback:**
```sql
-- Ungroup all vehicles
UPDATE vehicles SET 
  group_id = NULL,
  group_index = NULL,
  individual_identifier = NULL
WHERE group_id IS NOT NULL;

-- Deactivate groups
UPDATE vehicle_groups SET is_active = FALSE;
```

## Future Enhancements

### Phase 2 Features

1. **Smart Assignment Algorithm**
   - Distribute usage evenly across fleet
   - Consider maintenance schedules
   - Optimize for vehicle longevity

2. **Advanced Analytics**
   - Group utilization reports
   - Revenue per unit tracking
   - Maintenance cost analysis

3. **Dynamic Pricing**
   - Peak/off-peak pricing for groups
   - Last-unit premium pricing
   - Bulk booking discounts

4. **Fleet Management**
   - Maintenance scheduling per unit
   - Rotate vehicles automatically
   - Track mileage/usage per unit

### Integration Opportunities

1. **Channel Manager**
   - Sync group availability across platforms
   - Unified inventory management
   - Real-time updates

2. **Mobile App**
   - Group management on mobile
   - Quick availability checks
   - Push notifications for low inventory

3. **API for Partners**
   - Expose group availability API
   - Bulk booking capabilities
   - White-label integration

## Success Metrics

### Adoption Metrics
- % of shops using groups
- Average group size
- Time saved in vehicle management

### Performance Metrics
- Page load time with groups
- API response times
- Database query performance

### Business Metrics
- Booking conversion rate
- Average revenue per group
- Customer satisfaction scores

## Conclusion

The vehicle grouping feature represents a significant enhancement to Siargao Rides' platform. By implementing a smart grouping system that balances user experience with operational needs, we can provide shop owners with powerful inventory management tools while improving the customer booking experience.

The phased approach ensures minimal disruption to existing operations while allowing for iterative improvements based on user feedback. With proper execution, this feature will position Siargao Rides as a leader in vehicle rental management solutions.