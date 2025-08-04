// Mock data for surf schools
// This provides realistic data for frontend development before backend integration

import { SurfSchool, SurfSchoolService, SurfSchoolImage, SurfSchoolBrowseResponse, SurfSchoolFilters } from '../types/surf-school';

// Mock images (using placeholder URLs that match the design brief)
const mockImages = [
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1520637836862-4d197d17c27a?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=800&h=600&fit=crop',
];

// Mock services
const mockServices: SurfSchoolService[] = [
  {
    id: '1',
    school_id: '1',
    service_name: 'Beginner Group Lesson',
    description: 'Perfect for first-time surfers. Learn the basics in a fun, supportive group environment.',
    price_per_hour: 1500,
    duration_hours: 2,
    max_students: 4,
    skill_level: 'beginner',
    equipment_included: true,
    is_active: true,
    display_order: 1,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    school_id: '1',
    service_name: 'Private Lesson',
    description: 'One-on-one instruction tailored to your skill level and goals.',
    price_per_hour: 2500,
    duration_hours: 1.5,
    max_students: 1,
    skill_level: 'all',
    equipment_included: true,
    is_active: true,
    display_order: 2,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '3',
    school_id: '1',
    service_name: 'Intermediate Coaching',
    description: 'Take your surfing to the next level with advanced techniques and wave reading.',
    price_per_hour: 2000,
    duration_hours: 2,
    max_students: 3,
    skill_level: 'intermediate',
    equipment_included: true,
    is_active: true,
    display_order: 3,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

// Mock images
const mockSchoolImages: SurfSchoolImage[] = [
  {
    id: '1',
    school_id: '1',
    image_url: mockImages[0],
    caption: 'Surf lessons at Cloud 9',
    is_featured: true,
    display_order: 1,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    school_id: '1',
    image_url: mockImages[1],
    caption: 'Beginner-friendly waves',
    is_featured: false,
    display_order: 2,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '3',
    school_id: '1',
    image_url: mockImages[2],
    caption: 'Professional equipment',
    is_featured: false,
    display_order: 3,
    created_at: '2024-01-15T10:00:00Z',
  },
];

// Mock surf schools
export const mockSurfSchools: SurfSchool[] = [
  {
    id: '1',
    owner_id: 'user-1',
    name: 'Cloud 9 Surf Academy',
    description: 'Professional surf instruction with 8+ years experience. Specializing in beginner to intermediate lessons at Cloud 9, Siargao\'s most famous surf break.',
    instructor_name: 'Miguel Santos',
    experience_years: 8,
    contact: {
      phone_number: '+639123456789',
      whatsapp: '+639123456789',
      email: 'info@cloud9surfacademy.com',
      instagram: 'cloud9surfacademy',
      facebook: 'cloud9surfacademy',
      website: 'https://cloud9surfacademy.com',
    },
    location: 'Cloud 9',
    address: 'Cloud 9 Surf Break, General Luna, Siargao Island',
    city: 'General Luna',
    latitude: 9.7749,
    longitude: 126.1493,
    location_area: 'Cloud 9',
    logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop&crop=center',
    banner_url: mockImages[0],
    banner_position_x: 50,
    banner_position_y: 50,
    is_verified: true,
    is_active: true,
    status: 'active',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    services: mockServices,
    images: mockSchoolImages,
    average_rating: 4.8,
    review_count: 12,
    starting_price: 1500,
    featured_image: mockImages[0],
  },
  {
    id: '2',
    owner_id: 'user-2',
    name: 'Siargao Surf Collective',
    description: 'Local surf school founded by passionate surfers. We offer personalized lessons and surf trips around the island.',
    instructor_name: 'Maria Rodriguez',
    experience_years: 5,
    contact: {
      phone_number: '+639987654321',
      whatsapp: '+639987654321',
      email: 'hello@siargosurf.com',
      instagram: 'siargosurf',
      facebook: 'siargosurf',
    },
    location: 'General Luna',
    address: 'Tourism Road, General Luna, Siargao Island',
    city: 'General Luna',
    latitude: 9.7749,
    longitude: 126.1493,
    location_area: 'General Luna',
    logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop&crop=center',
    banner_url: mockImages[1],
    banner_position_x: 50,
    banner_position_y: 50,
    is_verified: true,
    is_active: true,
    status: 'active',
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
    services: [
      {
        id: '4',
        school_id: '2',
        service_name: 'Beginner Package',
        description: 'Complete beginner package with 3 lessons and equipment.',
        price_per_hour: 1200,
        duration_hours: 2,
        max_students: 6,
        skill_level: 'beginner',
        equipment_included: true,
        is_active: true,
        display_order: 1,
        created_at: '2024-01-20T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z',
      },
      {
        id: '5',
        school_id: '2',
        service_name: 'Surf Trip',
        description: 'Explore hidden surf spots around Siargao Island.',
        price_per_hour: 3000,
        duration_hours: 6,
        max_students: 4,
        skill_level: 'intermediate',
        equipment_included: true,
        is_active: true,
        display_order: 2,
        created_at: '2024-01-20T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z',
      },
    ],
    images: [
      {
        id: '4',
        school_id: '2',
        image_url: mockImages[3],
        caption: 'Group surf lesson',
        is_featured: true,
        display_order: 1,
        created_at: '2024-01-20T10:00:00Z',
      },
      {
        id: '5',
        school_id: '2',
        image_url: mockImages[4],
        caption: 'Surf trip adventure',
        is_featured: false,
        display_order: 2,
        created_at: '2024-01-20T10:00:00Z',
      },
    ],
    average_rating: 4.6,
    review_count: 8,
    starting_price: 1200,
    featured_image: mockImages[3],
  },
  {
    id: '3',
    owner_id: 'user-3',
    name: 'Island Surf School',
    description: 'Authentic local surf experience with certified instructors. Perfect for all skill levels.',
    instructor_name: 'Juan Dela Cruz',
    experience_years: 12,
    contact: {
      phone_number: '+639111222333',
      whatsapp: '+639111222333',
      email: 'surf@islandsurf.ph',
      instagram: 'islandsurf',
    },
    location: 'Pilar',
    address: 'Pilar Beach, Siargao Island',
    city: 'Pilar',
    latitude: 9.8500,
    longitude: 126.0833,
    location_area: 'Pilar',
    logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop&crop=center',
    banner_url: mockImages[2],
    banner_position_x: 50,
    banner_position_y: 50,
    is_verified: false,
    is_active: true,
    status: 'pending_verification',
    created_at: '2024-01-25T10:00:00Z',
    updated_at: '2024-01-25T10:00:00Z',
    services: [
      {
        id: '6',
        school_id: '3',
        service_name: 'Private Coaching',
        description: 'Personalized one-on-one surf coaching session.',
        price_per_hour: 2000,
        duration_hours: 1.5,
        max_students: 1,
        skill_level: 'all',
        equipment_included: true,
        is_active: true,
        display_order: 1,
        created_at: '2024-01-25T10:00:00Z',
        updated_at: '2024-01-25T10:00:00Z',
      },
    ],
    images: [
      {
        id: '6',
        school_id: '3',
        image_url: mockImages[5],
        caption: 'Pilar surf break',
        is_featured: true,
        display_order: 1,
        created_at: '2024-01-25T10:00:00Z',
      },
    ],
    average_rating: 4.9,
    review_count: 15,
    starting_price: 2000,
    featured_image: mockImages[5],
  },
  {
    id: '4',
    owner_id: 'user-4',
    name: 'Pacifico Surf Academy',
    description: 'Learn to surf at the beautiful Pacifico Beach. Family-friendly lessons with patient instructors.',
    instructor_name: 'Ana Gutierrez',
    experience_years: 6,
    contact: {
      phone_number: '+639444555666',
      whatsapp: '+639444555666',
      email: 'info@pacificosurf.com',
      instagram: 'pacificosurf',
      facebook: 'pacificosurf',
    },
    location: 'Pacifico',
    address: 'Pacifico Beach, San Isidro, Siargao Island',
    city: 'San Isidro',
    latitude: 9.8000,
    longitude: 126.0500,
    location_area: 'Pacifico',
    logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop&crop=center',
    banner_url: mockImages[6],
    banner_position_x: 50,
    banner_position_y: 50,
    is_verified: true,
    is_active: true,
    status: 'active',
    created_at: '2024-01-30T10:00:00Z',
    updated_at: '2024-01-30T10:00:00Z',
    services: [
      {
        id: '7',
        school_id: '4',
        service_name: 'Family Lesson',
        description: 'Perfect for families with kids. Safe and fun introduction to surfing.',
        price_per_hour: 1800,
        duration_hours: 2,
        max_students: 5,
        skill_level: 'beginner',
        equipment_included: true,
        is_active: true,
        display_order: 1,
        created_at: '2024-01-30T10:00:00Z',
        updated_at: '2024-01-30T10:00:00Z',
      },
      {
        id: '8',
        school_id: '4',
        service_name: 'Advanced Coaching',
        description: 'High-performance coaching for experienced surfers.',
        price_per_hour: 2800,
        duration_hours: 2,
        max_students: 2,
        skill_level: 'advanced',
        equipment_included: true,
        is_active: true,
        display_order: 2,
        created_at: '2024-01-30T10:00:00Z',
        updated_at: '2024-01-30T10:00:00Z',
      },
    ],
    images: [
      {
        id: '7',
        school_id: '4',
        image_url: mockImages[7],
        caption: 'Family surf lesson',
        is_featured: true,
        display_order: 1,
        created_at: '2024-01-30T10:00:00Z',
      },
    ],
    average_rating: 4.7,
    review_count: 9,
    starting_price: 1800,
    featured_image: mockImages[7],
  },
];

// Mock filter options
export const mockFilterOptions = {
  locations: ['General Luna', 'Cloud 9', 'Pilar', 'Pacifico'] as SurfSchoolLocation[],
  skill_levels: ['beginner', 'intermediate', 'advanced', 'all'] as SkillLevel[],
  price_range: {
    min: 1200,
    max: 3000,
  },
};

// Mock API function to simulate browsing surf schools
export async function mockBrowseSurfSchools(filters: SurfSchoolFilters = {}): Promise<SurfSchoolBrowseResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  let filteredSchools = [...mockSurfSchools];

  // Apply filters
  if (filters.location) {
    filteredSchools = filteredSchools.filter(school => school.location === filters.location);
  }

  if (filters.skill_levels && filters.skill_levels.length > 0) {
    filteredSchools = filteredSchools.filter(school => 
      school.services.some(service => 
        filters.skill_levels!.includes(service.skill_level)
      )
    );
  }

  if (filters.price_min || filters.price_max) {
    filteredSchools = filteredSchools.filter(school => {
      const schoolMinPrice = Math.min(...school.services.map(s => s.price_per_hour));
      const schoolMaxPrice = Math.max(...school.services.map(s => s.price_per_hour));
      
      if (filters.price_min && schoolMaxPrice < filters.price_min) return false;
      if (filters.price_max && schoolMinPrice > filters.price_max) return false;
      
      return true;
    });
  }

  if (filters.verified_only) {
    filteredSchools = filteredSchools.filter(school => school.is_verified);
  }

  if (filters.min_rating) {
    filteredSchools = filteredSchools.filter(school => 
      school.average_rating ? school.average_rating >= filters.min_rating! : false
    );
  }

  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filteredSchools = filteredSchools.filter(school =>
      school.name.toLowerCase().includes(searchTerm) ||
      school.instructor_name?.toLowerCase().includes(searchTerm) ||
      school.description?.toLowerCase().includes(searchTerm)
    );
  }

  // Apply sorting
  if (filters.sort_by) {
    filteredSchools.sort((a, b) => {
      switch (filters.sort_by) {
        case 'rating_desc':
          return (b.average_rating || 0) - (a.average_rating || 0);
        case 'price_asc':
          return (a.starting_price || 0) - (b.starting_price || 0);
        case 'price_desc':
          return (b.starting_price || 0) - (a.starting_price || 0);
        case 'experience_desc':
          return (b.experience_years || 0) - (a.experience_years || 0);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  }

  // Apply pagination
  const page = filters.page || 1;
  const limit = filters.limit || 12;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedSchools = filteredSchools.slice(startIndex, endIndex);

  return {
    schools: paginatedSchools,
    pagination: {
      page,
      limit,
      total: filteredSchools.length,
      totalPages: Math.ceil(filteredSchools.length / limit),
    },
    filters: mockFilterOptions,
  };
}

// Mock API function to get a single surf school
export async function mockGetSurfSchool(id: string): Promise<SurfSchool | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  return mockSurfSchools.find(school => school.id === id) || null;
}