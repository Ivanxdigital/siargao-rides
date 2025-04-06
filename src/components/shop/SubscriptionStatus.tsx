import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
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
      const endDate = new Date(shop.subscription_end_date);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysLeft(Math.max(0, diffDays));
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
          <Clock className="text-primary h-5 w-5" />
          <h3 className="font-medium">Subscription Status</h3>
        </div>
        {shop.subscription_status === 'active' && (
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <span className="absolute -left-1 -top-1">
                <span className="flex h-2 w-2 animate-ping absolute rounded-full bg-primary opacity-75"></span>
                <span className="flex h-2 w-2 relative rounded-full bg-primary"></span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2">
                TRIAL
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Status Content */}
      <div className="p-4">
        {shop.subscription_status === 'active' ? (
          <div className="space-y-4">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-sm">Active Trial</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{daysLeft} days left</span>
              </div>
              
              <div className="relative w-full">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500"
                    style={{ width: `${100 - trialPercentage}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {shop.subscription_start_date && 
                      new Date(shop.subscription_start_date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })
                    }
                  </div>
                  <div className="flex items-center">
                    {shop.subscription_end_date && 
                      new Date(shop.subscription_end_date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })
                    }
                    <Calendar className="h-3 w-3 ml-1" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
              <div className="flex items-start">
                <Zap className="h-4 w-4 text-primary mt-0.5 mr-2 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Free Trial Period: </span> 
                  Enjoy full access to all features during your 30-day trial
                </p>
              </div>
            </div>
            
            <Link 
              href="/dashboard/subscription" 
              className="flex items-center justify-between text-xs text-primary hover:underline mt-2 pt-2"
            >
              <span>View subscription details</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        ) : shop.subscription_status === 'expired' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs px-2.5 py-0.5 rounded-full">
                Expired
              </span>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-100 dark:border-red-900/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-500 h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 dark:text-red-400 mb-1">Your free trial has ended</h4>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    Soon you'll be able to subscribe to continue listing your vehicles
                  </p>
                </div>
              </div>
            </div>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/subscription">
                View Subscription Options
              </Link>
            </Button>
          </div>
        ) : !shop.is_verified ? (
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
                    Your shop is being verified by our team. After verification, you can add vehicles to start your free trial.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs px-2.5 py-0.5 rounded-full">
                Ready to Start
              </span>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-start gap-3">
                <Zap className="text-blue-500 h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-400 mb-1">Start your free trial</h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Add your first vehicle to activate your free 30-day trial with full access to all features.
                  </p>
                </div>
              </div>
            </div>
            
            <Button asChild className="w-full">
              <Link href="/dashboard/vehicles/add">
                Add Your First Vehicle
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
