/**
 * Feature flags for Siargao Rides
 * 
 * This file contains feature flags that can be used to enable/disable features
 * in the application. This is useful for rolling out new features gradually
 * or for A/B testing.
 */

// Get feature flags from environment variables
const getFeatureFlag = (flagName: string, defaultValue: boolean = false): boolean => {
  if (typeof window === 'undefined') {
    // Server-side
    return process.env[`NEXT_PUBLIC_FEATURE_${flagName}`] === 'true' || defaultValue;
  } else {
    // Client-side
    return (window as any).__FEATURE_FLAGS__?.[flagName] || 
           process.env[`NEXT_PUBLIC_FEATURE_${flagName}`] === 'true' || 
           defaultValue;
  }
};

// Feature flags
export const featureFlags = {
  // New shop owner onboarding flow
  ONBOARDING_V2: getFeatureFlag('ONBOARDING_V2', true),
  
  // Add more feature flags here as needed
};

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (featureName: keyof typeof featureFlags): boolean => {
  return featureFlags[featureName];
};
