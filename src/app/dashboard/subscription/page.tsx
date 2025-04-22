"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { AlertCircle, ShoppingBag, Clock, CheckCircle, Shield } from "lucide-react";

type ShopData = {
  id: string;
  name: string;
  address: string;
  is_verified: boolean;
  subscription_status?: string;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  is_active?: boolean;
};

export default function SubscriptionPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [shop, setShop] = useState<ShopData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [daysLeft, setDaysLeft] = useState(0);
  const [trialProgress, setTrialProgress] = useState(0);
  
  useEffect(() => {
    if (user && user.user_metadata?.role !== "shop_owner") {
      router.push("/dashboard");
      return;
    }

    const fetchShop = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const supabase = createClientComponentClient();
        
        const { data, error } = await supabase
          .from("rental_shops")
          .select("*")
          .eq("owner_id", user.id)
          .single();
          
        if (error) {
          console.error("Error fetching shop:", error);
          return;
        }
        
        setShop(data);
        
        // Calculate days left in subscription
        if (data?.subscription_end_date) {
          const endDate = new Date(data.subscription_end_date);
          const now = new Date();
          const diffTime = endDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysLeft(Math.max(0, diffDays));
          
          // Calculate trial progress (assuming 30-day trial)
          if (data?.subscription_start_date && data.subscription_status === 'active') {
            const startDate = new Date(data.subscription_start_date);
            const totalTrial = 30; // 30 days trial
            const daysPassed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const progress = Math.min(100, Math.max(0, (daysPassed / totalTrial) * 100));
            setTrialProgress(progress);
          }
        }
      } catch (err) {
        console.error("Error in fetchShop:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && user) {
      fetchShop();
    }
  }, [isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">No Shop Found</h1>
          <p className="text-muted-foreground mb-6">
            You don't have a registered shop yet.
          </p>
          <Button asChild>
            <Link href="/register">Register Your Shop</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Subscription Status</h1>
      <p className="text-muted-foreground mb-8">Manage your shop's subscription</p>
      
      <div className="bg-card rounded-xl border border-border p-8 shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8 pb-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">{shop.name}</h2>
            <p className="text-muted-foreground">{shop.address}</p>
          </div>
          
          <div>
            {shop.is_verified ? (
              <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs px-2.5 py-1 rounded-full">
                Verified
              </span>
            ) : (
              <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs px-2.5 py-1 rounded-full">
                Pending Verification
              </span>
            )}
          </div>
        </div>
        
        {!shop.is_verified ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-center mb-8">
            <Clock size={40} className="text-amber-600 dark:text-amber-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Pending Verification</h3>
            <p className="text-muted-foreground">
              Your shop is currently being reviewed by our team. You'll be able to add vehicles once it's verified.
            </p>
          </div>
        ) : shop.subscription_status === 'expired' ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center mb-8">
            <AlertCircle size={40} className="text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Free Trial Expired</h3>
            <p className="text-muted-foreground mb-6">
              Your free trial has ended. Soon you'll be able to subscribe to continue listing your vehicles.
            </p>
            <Button disabled className="cursor-not-allowed">
              Subscribe Coming Soon
            </Button>
          </div>
        ) : shop.subscription_status === 'active' ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center mb-8">
            <CheckCircle size={40} className="text-green-600 dark:text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Active Free Trial</h3>
            <p className="text-muted-foreground mb-4">
              Your free trial is active until {new Date(shop.subscription_end_date!).toLocaleDateString()}.
            </p>
            <div className="max-w-md mx-auto">
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${trialProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground">
                {daysLeft} days remaining
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center mb-8">
            <ShoppingBag size={40} className="text-primary mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Start Your Free Trial</h3>
            <p className="text-muted-foreground mb-6">
              Add your first vehicle to start your free 1-month trial!
            </p>
            <Button asChild>
              <Link href="/dashboard/vehicles/add">Add Your First Vehicle</Link>
            </Button>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">Free Trial</p>
              <p className="text-sm text-muted-foreground">30 days free access</p>
            </div>
            {shop.subscription_status === 'active' && (
              <span className="text-sm bg-primary/20 text-primary px-2 py-1 rounded">Current Plan</span>
            )}
          </div>
          
          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg opacity-60">
            <div>
              <p className="font-medium">Monthly Subscription</p>
              <p className="text-sm text-muted-foreground">₱XXX per month</p>
            </div>
            <span className="text-sm bg-muted text-muted-foreground px-2 py-1 rounded">Coming Soon</span>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg opacity-60">
            <div>
              <p className="font-medium">Annual Subscription</p>
              <p className="text-sm text-muted-foreground">₱XXX per year (Save XX%)</p>
            </div>
            <span className="text-sm bg-muted text-muted-foreground px-2 py-1 rounded">Coming Soon</span>
          </div>
          
          <div className="mt-6 p-4 border border-primary/20 rounded-lg bg-primary/5 text-center">
            <div className="flex items-center justify-center mb-2">
              <Shield size={20} className="text-primary mr-2" />
              <span className="font-medium">Subscription Benefits</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 mt-3">
              <li>List unlimited vehicles to rent out</li>
              <li>Manage your bookings and rentals</li>
              <li>Appear in search results and browse pages</li>
              <li>Receive inquiries from potential customers</li>
              <li>Track your shop performance and statistics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
