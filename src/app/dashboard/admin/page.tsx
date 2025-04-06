"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingShops, setIsLoadingShops] = useState(false);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  // Fetch users
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
          const { data, error } = await supabase
            .from("users")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(10);

          if (error) {
            console.error("Error fetching users:", error.message || error);
          } else {
            setUsers(data || []);
          }
        } catch (error: any) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error("Error fetching users:", errorMessage);
        } finally {
          setIsLoadingUsers(false);
        }
      };

      fetchUsers();
    }
  }, [isAuthenticated, isAdmin]);

  // Fetch shops
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      const fetchShops = async () => {
        setIsLoadingShops(true);
        try {
          const { data, error } = await supabase
            .from("rental_shops")
            .select("*, users!rental_shops_owner_id_fkey(first_name, last_name)")
            .order("created_at", { ascending: false })
            .limit(10);

          if (error) {
            console.error("Error fetching shops:", error.message || error);
          } else {
            setShops(data || []);
          }
        } catch (error: any) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error("Error fetching shops:", errorMessage);
        } finally {
          setIsLoadingShops(false);
        }
      };

      fetchShops();
    }
  }, [isAuthenticated, isAdmin]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // Show unauthorized message if not admin
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
        <p className="mb-6 text-white/70">You don't have permission to access the admin dashboard.</p>
        <Button asChild>
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  // Show dashboard content if authenticated
  return (
    <div>
      <div className="pt-2 md:pt-4 mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3 text-white">
          Admin Dashboard
        </h1>
        <p className="text-white/70 text-sm md:text-base">
          Manage users, shops, and platform settings.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Overview Stats */}
        <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-6 shadow-lg">
          <h2 className="text-lg font-semibold mb-4 text-white/90">Total Users</h2>
          <div className="text-4xl font-bold mb-2 text-primary">{users.length}</div>
          <p className="text-sm text-white/60">
            {isLoadingUsers ? "Loading..." : "Registered users on the platform"}
          </p>
        </div>

        <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-6 shadow-lg">
          <h2 className="text-lg font-semibold mb-4 text-white/90">Rental Shops</h2>
          <div className="text-4xl font-bold mb-2 text-primary">{shops.length}</div>
          <p className="text-sm text-white/60">
            {isLoadingShops ? "Loading..." : "Active rental shops"}
          </p>
        </div>

        <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-6 shadow-lg">
          <h2 className="text-lg font-semibold mb-4 text-white/90">Verification</h2>
          <div className="flex items-center mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-sm text-white/60 mb-4">
            Review and verify new rental shops
          </p>
          <Button asChild className="w-full">
            <Link href="/dashboard/admin/verification">Manage Verifications</Link>
          </Button>
        </div>
      </div>

      {/* Admin Tools */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-white/90 mb-4">Admin Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white/90">Subscription Management</h3>
            </div>
            <p className="text-sm text-white/60 mb-4">
              Manage shop subscriptions and trial periods
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/admin/subscriptions">Manage Subscriptions</Link>
            </Button>
          </div>
          
          {/* Add more admin tools here as needed */}
        </div>
      </div>

      {/* Recent Users */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white/90">Recent Users</h2>
        </div>
        
        <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/70">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-white/70">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-white/70">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-white/70">Role</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-white/70">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {isLoadingUsers ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-center text-white/60">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-center text-white/60">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-white/90">
                        {user.first_name || user.last_name
                          ? `${user.first_name || ""} ${user.last_name || ""}`
                          : "Unnamed User"}
                      </td>
                      <td className="px-4 py-3 text-white/80">{user.email || "No email"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-500/20 text-purple-400"
                            : user.role === "shop_owner"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-green-500/20 text-green-400"
                        }`}>
                          {user.role || "user"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/70 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Shops */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white/90">Recent Shops</h2>
          <Button asChild variant="outline" size="sm" className="border-white/10 hover:border-primary/30 bg-black/40 hover:bg-black/60">
            <Link href="/dashboard/admin/verification">Verify Shops</Link>
          </Button>
        </div>
        
        <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/70">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-white/70">Shop Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-white/70">Owner</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-white/70">Location</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-white/70">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {isLoadingShops ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-center text-white/60">
                      Loading shops...
                    </td>
                  </tr>
                ) : shops.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-center text-white/60">
                      No shops found
                    </td>
                  </tr>
                ) : (
                  shops.map((shop) => (
                    <tr key={shop.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-white/90">
                        {shop.name || "Unnamed Shop"}
                      </td>
                      <td className="px-4 py-3 text-white/80">
                        {shop.users?.first_name || shop.users?.last_name
                          ? `${shop.users?.first_name || ""} ${shop.users?.last_name || ""}`
                          : "Unknown Owner"}
                      </td>
                      <td className="px-4 py-3 text-white/80">
                        {shop.city || "Unknown Location"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          shop.is_verified
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          {shop.is_verified ? "Verified" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 