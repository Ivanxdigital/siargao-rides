import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, CheckCircle, Calendar, ChevronRight, Zap } from 'lucide-react';
import Link from 'next/link';

// Define the shop type that includes subscription fields
export interface ShopWithSubscription {
  id: string;
  name: string;
  is_verified: boolean;
  subscription_status?: 'active' | 'inactive' | 'expired'; 
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  is_active?: boolean;
  [key: string]: any; // Allow other fields
}

interface SubscriptionStatusProps {
  shop: ShopWithSubscription;
}

export const SubscriptionStatus = ({ shop }: SubscriptionStatusProps) => {
  const [daysLeft, setDaysLeft] = useState(0);
  
  useEffect(() => {
    if (shop?.subscription_end_date) {
      // Function to calculate days left
      const calculateDaysLeft = () => {
        // Make sure subscription_end_date exists and is not null
        if (!shop.subscription_end_date) return;
        
        const endDate = new Date(shop.subscription_end_date);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysLeft(Math.max(0, diffDays));
      };
      
      // Initial calculation
      calculateDaysLeft();
      
      // Update every day (86400000 ms = 24 hours)
      const interval = setInterval(calculateDaysLeft, 86400000);
      
      // Clean up interval on component unmount
      return () => clearInterval(interval);
    }
  }, [shop?.subscription_end_date]);
  
  if (!shop) {
    return null;
  }

  // Get percentage of trial used
  const getTrialPercentage = () => {
    if (!shop.subscription_start_date || !shop.subscription_end_date) return 0;
    
    const startDate = new Date(shop.subscription_start_date);
    const endDate = new Date(shop.subscription_end_date);
    const now = new Date();
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const usedDuration = now.getTime() - startDate.getTime();
    
    return Math.max(0, Math.min(100, (usedDuration / totalDuration) * 100));
  };

  const trialPercentage = getTrialPercentage();
  
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      {/* Status Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <CheckCircle className="text-green-500 h-5 w-5" />
          <h3 className="font-medium">Platform Access</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <span className="absolute -left-1 -top-1">
              <span className="flex h-2 w-2 animate-ping absolute rounded-full bg-green-500 opacity-75"></span>
              <span className="flex h-2 w-2 relative rounded-full bg-green-500"></span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full ml-2">
              FREE
            </span>
          </div>
        </div>
      </div>
      
      {/* Status Content - SUBSCRIPTION SYSTEM DISABLED */}
      <div className="p-4">
        {!shop.is_verified ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs px-2.5 py-0.5 rounded-full">
                Pending Verification
              </span>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-100 dark:border-amber-900/30">
              <div className="flex items-start gap-3">
                <Clock className="text-amber-500 h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-400 mb-1">Verification in progress</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Your shop is being verified by our team. Once verified, you'll have free access to all features.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs px-2.5 py-0.5 rounded-full">
                Free Access Active
              </span>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-100 dark:border-green-900/30">
              <div className="flex items-start gap-3">
                <Zap className="text-green-500 h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-400 mb-1">🎉 Completely Free!</h4>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Siargao Rides is now free to use forever. No subscriptions, no trial periods, no limits!
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 mr-2 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Full Access: </span> 
                  List unlimited vehicles, manage bookings, and use all platform features at no cost
                </p>
              </div>
            </div>
            
            <Link 
              href="/dashboard/vehicles" 
              className="flex items-center justify-between text-xs text-primary hover:underline mt-2 pt-2"
            >
              <span>Manage your vehicles</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
