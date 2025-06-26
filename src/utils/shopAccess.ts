import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type ShopStatus = {
  isLoading: boolean;
  hasAccess: boolean;
  isVerified: boolean;
  subscriptionStatus?: 'active' | 'inactive' | 'expired' | null;
  subscriptionEndDate?: string | null;
  shopId?: string | null;
};

/**
 * Hook to check if a shop owner has access to dashboard pages
 * Redirects to subscription page if the shop's subscription is inactive or expired
 * 
 * @param skipRedirect If true, won't redirect automatically on access denial
 * @returns Shop status object with access information
 */
export function useShopAccess(skipRedirect = false): ShopStatus {
  const router = useRouter();
  const [status, setStatus] = useState<ShopStatus>({
    isLoading: true,
    hasAccess: false,
    isVerified: false,
  });

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const supabase = createClientComponentClient();
        
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setStatus({
            isLoading: false,
            hasAccess: false,
            isVerified: false,
          });
          
          if (!skipRedirect) {
            router.push('/sign-in');
          }
          return;
        }
        
        // Check if user is a shop owner
        const userRole = session.user.user_metadata?.role;
        if (userRole !== 'shop_owner') {
          setStatus({
            isLoading: false,
            hasAccess: true, // Non-shop owners still have access to their dashboard
            isVerified: false,
          });
          return;
        }
        
        // Get shop information
        const { data: shopData, error: shopError } = await supabase
          .from('rental_shops')
          .select('id, is_verified, is_active, subscription_status, subscription_end_date')
          .eq('owner_id', session.user.id)
          .single();
        
        if (shopError) {
          console.error('Error fetching shop data:', shopError);
          setStatus({
            isLoading: false,
            hasAccess: false,
            isVerified: false,
          });
          
          if (!skipRedirect) {
            router.push('/dashboard');
          }
          return;
        }
        
        // SUBSCRIPTION SYSTEM DISABLED: All verified shops now have free access
        if (shopData.is_verified) {
          // All verified shops automatically have access (subscription system disabled)
          setStatus({
            isLoading: false,
            hasAccess: true, // Always true - subscription system disabled
            isVerified: true,
            subscriptionStatus: 'active', // Always show as active
            subscriptionEndDate: shopData.subscription_end_date,
            shopId: shopData.id
          });
          
          // No redirect needed - all verified shops have access
        } else {
          // For unverified shops, they can still access their main dashboard 
          // but we'll let components handle specific restrictions
          setStatus({
            isLoading: false,
            hasAccess: true, // They can at least see the dashboard
            isVerified: false,
            subscriptionStatus: 'active', // Show as active even if unverified
            shopId: shopData.id
          });
        }
      } catch (error) {
        console.error('Error checking shop access:', error);
        setStatus({
          isLoading: false,
          hasAccess: false,
          isVerified: false,
        });
      }
    };
    
    checkAccess();
  }, [router, skipRedirect]);

  return status;
}
