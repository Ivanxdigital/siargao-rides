import type { RentalShop } from "@/types/shop";

export interface ShopSetupStatus {
  shopHasVehicles: boolean;
  shopHasLogo: boolean;
  shopHasBanner: boolean;
  shopHasDescription: boolean;
  shopHasLocation: boolean;
  shopHasContactInfo: boolean;
  shouldShowGuide: boolean;
  completionPercentage: number;
}

/**
 * Check a shop's setup status to determine if onboarding guidance is needed
 * @param shop The shop data object
 * @param vehicleCount The number of vehicles this shop has
 * @returns An object with various setup status flags and whether to show the guide
 */
export function checkShopSetupStatus(
  shop: Partial<RentalShop> | null | undefined, 
  vehicleCount: number = 0
): ShopSetupStatus {
  if (!shop) {
    return {
      shopHasVehicles: false,
      shopHasLogo: false,
      shopHasBanner: false, 
      shopHasDescription: false,
      shopHasLocation: false,
      shopHasContactInfo: false,
      shouldShowGuide: false,
      completionPercentage: 0
    };
  }

  // Check if shop has vehicles
  const hasVehicles = vehicleCount > 0;
  
  // Check if shop has logo and banner
  const hasLogo = !!shop.logo_url;
  const hasBanner = !!shop.banner_url;
  
  // Check if shop has description (at least 20 chars)
  const hasDescription = !!shop.description && shop.description.length >= 20;
  
  // Check if shop has location
  const hasLocation = !!shop.location_area || !!shop.address;
  
  // Check if shop has contact information (at least one method)
  const hasContactInfo = !!(
    shop.phone_number || 
    shop.whatsapp || 
    shop.email || 
    shop.facebook_url || 
    shop.instagram_url ||
    shop.phone_number
  );
  
  // Calculate completion percentage
  const totalSteps = 6;
  const completedSteps = [
    hasVehicles,
    hasLogo,
    hasBanner,
    hasDescription,
    hasLocation,
    hasContactInfo
  ].filter(Boolean).length;
  
  const completionPercentage = Math.round((completedSteps / totalSteps) * 100);
  
  // Determine if we should show the guide
  // Show guide if shop is verified but setup is not complete
  const isNewlyVerified = shop.is_verified === true && completionPercentage < 100;
  
  // Show the guide if:
  // 1. Shop is verified
  // 2. AND either has no vehicles OR is missing more than 2 setup steps
  const shouldShowGuide = isNewlyVerified && (
    !hasVehicles || completionPercentage < 70
  );
  
  return {
    shopHasVehicles: hasVehicles,
    shopHasLogo: hasLogo,
    shopHasBanner: hasBanner,
    shopHasDescription: hasDescription,
    shopHasLocation: hasLocation,
    shopHasContactInfo: hasContactInfo,
    shouldShowGuide,
    completionPercentage
  };
} 