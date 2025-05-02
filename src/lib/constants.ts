/**
 * Shared constants for Siargao Rides
 * 
 * This file contains constants that are used across multiple components
 * to ensure consistency throughout the application.
 */

// Predefined Siargao locations used in SearchBar and shop registration
export const SIARGAO_LOCATIONS = [
  "General Luna",
  "Cloud 9",
  "Pacifico",
  "Dapa",
  "Union",
  "Pilar",
  "Santa Monica",
  "San Isidro",
  "Del Carmen",
  "Burgos",
  "Maasin River",
  "Sugba Lagoon",
  "Magpupungko Rock Pools"
];

// Vehicle types
export const VEHICLE_TYPES = [
  { vehicleType: 'motorcycle', label: 'Motorbike', icon: 'bike' },
  { vehicleType: 'car', label: 'Car', icon: 'car' },
  { vehicleType: 'tuktuk', label: 'TukTuk', icon: 'truck' }
];

// Default categories for each vehicle type
export const DEFAULT_CATEGORIES = {
  motorcycle: 'scooter',
  car: 'sedan',
  tuktuk: 'standard'
};

// Budget options as presets
export const BUDGET_OPTIONS = [
  { label: "Budget (< ₱500)", value: 500 },
  { label: "Mid-range (₱500-1000)", value: 1000 },
  { label: "Premium (₱1000+)", value: 1500 }
];
