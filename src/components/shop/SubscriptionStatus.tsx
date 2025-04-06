import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';
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
  
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Clock className="text-primary h-5 w-5" />
        <h3 className="font-medium">Subscription Status</h3>
      </div>
      
      {shop.subscription_status === 'active' ? (
        <>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs px-2.5 py-0.5 rounded-full">
              Active
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Your free trial ends in <span className="font-bold text-foreground">{daysLeft} days</span>
          </p>
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-1">
            <div 
              className="h-full bg-primary" 
              style={{ 
                width: `${Math.max(0, Math.min(100, (30 - daysLeft) / 30 * 100))}%` 
              }}
            ></div>
          </div>
          <p className="text-xs text-muted-foreground">
            Free 1-month trial
          </p>
        </>
      ) : shop.subscription_status === 'expired' ? (
        <>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs px-2.5 py-0.5 rounded-full">
              Expired
            </span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30 mb-3">
            <AlertCircle className="text-red-500 h-5 w-5 shrink-0" />
            <p className="text-sm text-red-800 dark:text-red-400">
              Your free trial has ended. Soon you'll be able to subscribe to continue listing your vehicles.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="w-full mt-2">
            <Link href="/dashboard/subscription">View Subscription Options</Link>
          </Button>
        </>
      ) : !shop.is_verified ? (
        <>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs px-2.5 py-0.5 rounded-full">
              Pending Verification
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Your shop is being verified by our team. After verification, you can add vehicles to start your free trial.
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs px-2.5 py-0.5 rounded-full">
              Ready to Start
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first vehicle to start your free 1-month trial!
          </p>
          <Button asChild size="sm" className="w-full">
            <Link href="/dashboard/vehicles/add">Add Your First Vehicle</Link>
          </Button>
        </>
      )}
    </div>
  );
};
