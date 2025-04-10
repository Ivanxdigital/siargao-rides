"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import DepositPayoutManager from "@/components/admin/DepositPayoutManager";
import { AlertCircle } from "lucide-react";

export default function DepositPayoutsPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push('/sign-in');
          return;
        }

        // Check if user is admin from user metadata
        const isUserAdmin = user.user_metadata?.role === 'admin';
        setIsAdmin(isUserAdmin);

        console.log('User metadata:', user.user_metadata);
        console.log('Is admin from metadata:', isUserAdmin);

      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start">
          <AlertCircle className="text-red-500 w-5 h-5 mt-0.5 mr-2" />
          <div>
            <h3 className="font-medium text-red-500">Access Denied</h3>
            <p className="text-red-400">You don't have permission to access this page. This area is restricted to administrators only.</p>
          </div>
        </div>
      </div>
    );
  }

  return <DepositPayoutManager />;
}
