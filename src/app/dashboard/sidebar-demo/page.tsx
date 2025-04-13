"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AceternityDashboardLayout from "@/components/dashboard/AceternityDashboardLayout";

export default function SidebarDemoPage() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isShopOwner, setIsShopOwner] = useState(false);

  // Check user roles
  useEffect(() => {
    if (user) {
      // Check if user is admin
      const userIsAdmin = user.app_metadata?.is_admin === true;
      setIsAdmin(userIsAdmin);

      // Check if user is shop owner
      const userIsShopOwner = user.app_metadata?.is_shop_owner === true;
      setIsShopOwner(userIsShopOwner);
    }
  }, [user]);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <AceternityDashboardLayout 
      isAdmin={isAdmin}
      isShopOwner={isShopOwner}
      signOut={signOut}
      user={user}
    >
      <div className="bg-black/30 backdrop-blur-lg border border-white/5 rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Aceternity Sidebar Demo</h1>
        <p className="text-white/70 mb-6">
          This is a demo of the Aceternity sidebar component integrated with your dashboard.
          Try hovering over the sidebar to expand it, and test the navigation links.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black/50 border border-white/10 rounded-lg p-4">
            <h2 className="text-lg font-medium mb-2">Features</h2>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>Hover to expand sidebar</li>
              <li>Responsive mobile design</li>
              <li>Role-based navigation</li>
              <li>Active state highlighting</li>
              <li>Smooth animations</li>
            </ul>
          </div>
          
          <div className="bg-black/50 border border-white/10 rounded-lg p-4">
            <h2 className="text-lg font-medium mb-2">User Info</h2>
            <div className="text-white/70 space-y-2">
              <p><span className="font-medium text-white">Email:</span> {user?.email}</p>
              <p><span className="font-medium text-white">Name:</span> {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}</p>
              <p><span className="font-medium text-white">Admin:</span> {isAdmin ? "Yes" : "No"}</p>
              <p><span className="font-medium text-white">Shop Owner:</span> {isShopOwner ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>
      </div>
    </AceternityDashboardLayout>
  );
}
