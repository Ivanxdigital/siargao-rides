import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingGuide } from "@/components/shop/OnboardingGuide";
import { checkShopSetupStatus } from "@/utils/shopSetupStatus";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface ShopSetupGuideProps {
  shopId?: string; // Optional shopId if already known
  vehicleCount?: number; // Optional vehicle count if already known
  isVisible?: boolean; // Whether the guide is visible
  onToggleVisibility?: () => void; // Callback when visibility is toggled
}

export function ShopSetupGuide({
  shopId,
  vehicleCount,
  isVisible = true,
  onToggleVisibility
}: ShopSetupGuideProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shopSetupStatus, setShopSetupStatus] = useState({
    shopHasVehicles: false,
    shopHasLogo: false,
    shopHasBanner: false,
    shopHasDescription: false,
    shopHasLocation: false,
    shopHasContactInfo: false,
    shouldShowGuide: false,
    completionPercentage: 0
  });
  const [shopData, setShopData] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if device is mobile
  const isMobile = useMediaQuery("(max-width: 640px)");

  useEffect(() => {
    // Skip if user is not authenticated or not a shop owner
    if (!user || user.user_metadata?.role !== 'shop_owner') {
      setIsLoading(false);
      return;
    }

    const fetchShopSetupData = async () => {
      try {
        setIsLoading(true);
        const supabase = createClientComponentClient();

        // If shopId is not provided, fetch it
        let actualShopId = shopId;
        let actualVehicleCount = vehicleCount;
        let shopData;

        if (!actualShopId) {
          // Get the shop owned by this user
          const { data, error: shopError } = await supabase
            .from("rental_shops")
            .select("*")
            .eq("owner_id", user.id)
            .single();

          if (shopError) {
            console.error("Error fetching shop:", shopError);
            setIsLoading(false);
            return;
          }

          shopData = data;
          setShopData(data);
          actualShopId = data.id;
        } else {
          // Get shop data by ID
          const { data, error: shopError } = await supabase
            .from("rental_shops")
            .select("*")
            .eq("id", actualShopId)
            .single();

          if (shopError) {
            console.error("Error fetching shop by ID:", shopError);
            setIsLoading(false);
            return;
          }

          shopData = data;
          setShopData(data);
        }

        // If vehicle count is not provided, fetch it
        if (actualVehicleCount === undefined && actualShopId) {
          const { data: vehicles, error: vehiclesError } = await supabase
            .from("vehicles")
            .select("id, is_available")
            .eq("shop_id", actualShopId);

          if (!vehiclesError) {
            actualVehicleCount = vehicles?.length || 0;
          } else {
            console.error("Error fetching vehicles:", vehiclesError);
            actualVehicleCount = 0;
          }
        }

        // Check shop setup status
        const setupStatus = checkShopSetupStatus(shopData, actualVehicleCount || 0);
        setShopSetupStatus(setupStatus);
      } catch (err) {
        console.error("Error in fetchShopSetupData:", err);
        setError("Could not fetch shop setup data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchShopSetupData();
  }, [user, shopId, vehicleCount]);

  // Handle dismissing the guide
  const handleDismiss = () => {
    setIsDismissed(true);
  };

  // Don't render anything if still loading, there's an error, or was dismissed
  if (isLoading || error || isDismissed) {
    return null;
  }

  // If the guide shouldn't be shown based on shop status, but we still want to render the toggle button
  const showGuideContent = shopSetupStatus.shouldShowGuide;

  // We'll always render both states and use AnimatePresence to handle transitions
  // This allows for smoother animations between states

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleVisibility}
          className={`flex items-center gap-2 text-sm transition-all duration-300 ${!showGuideContent ? 'border-green-500/20 text-green-500 hover:bg-green-500/10' : 'border-primary/20 hover:bg-primary/10'}`}
        >
          <motion.div
            initial={false}
            animate={{ rotate: (isVisible && showGuideContent) ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="mr-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </motion.div>
          <span className="hidden sm:inline">
            {!showGuideContent ? 'Setup Complete' : isVisible ? 'Hide Setup Guide' : 'Show Setup Guide'}
          </span>
          <span className="sm:hidden">
            {!showGuideContent ? 'Complete' : isVisible ? 'Hide Guide' : 'Show Guide'}
          </span>
        </Button>
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            key="guide-content"
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{
              duration: 0.5,
              ease: [0.04, 0.62, 0.23, 0.98], // Custom easing for smooth animation
              height: { duration: 0.4 },
              opacity: { duration: 0.3 }
            }}
            className="overflow-hidden w-full"
          >
            {!showGuideContent ? (
              <div className="bg-gradient-to-br from-black to-gray-900 border border-green-500/20 rounded-xl p-4 sm:p-6 shadow-lg overflow-hidden relative w-full text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-12 w-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Shop Setup Complete!</h3>
                <p className="text-white/70 text-sm mb-4">
                  Congratulations! You've completed all the necessary steps to set up your shop. Your shop is now ready to receive bookings from tourists.
                </p>
              </div>
            ) : (
            <OnboardingGuide
              shopHasVehicles={shopSetupStatus.shopHasVehicles}
              shopHasLogo={shopSetupStatus.shopHasLogo}
              shopHasBanner={shopSetupStatus.shopHasBanner}
              shopHasDescription={shopSetupStatus.shopHasDescription}
              shopHasLocation={shopSetupStatus.shopHasLocation}
              shopHasContactInfo={shopSetupStatus.shopHasContactInfo}
              shopId={shopData?.id}
              onDismiss={handleDismiss}
              subscriptionStatus={shopData?.subscription_status}
            />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}