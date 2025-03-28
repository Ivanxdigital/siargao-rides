"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const supabase = createClientComponentClient();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.push("/sign-in");
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
            console.error("Error fetching users:", error);
          } else {
            setUsers(data || []);
          }
        } catch (error) {
          console.error("Error fetching users:", error);
        } finally {
          setIsLoadingUsers(false);
        }
      };

      fetchUsers();
    }
  }, [isAuthenticated, isAdmin, supabase]);

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
            console.error("Error fetching shops:", error);
          } else {
            setShops(data || []);
          }
        } catch (error) {
          console.error("Error fetching shops:", error);
        } finally {
          setIsLoadingShops(false);
        }
      };

      fetchShops();
    }
  }, [isAuthenticated, isAdmin, supabase]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  // Show unauthorized message if not admin
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
          <p className="mb-6">You don't have permission to access the admin dashboard.</p>
          <Button asChild>
            <Link href="/">Return to Homepage</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show dashboard content if authenticated
  return (
    <div className="pt-24">
      <>
        <div className="bg-black text-white">
          <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-lg">Manage users, shops, and platform settings.</p>
          </div>
        </div>
        
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* Overview Stats */}
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Total Users</h2>
                <div className="text-4xl font-bold mb-2 text-primary">{users.length}</div>
                <p className="text-sm text-muted-foreground">
                  {isLoadingUsers ? "Loading..." : "Registered users on the platform"}
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Rental Shops</h2>
                <div className="text-4xl font-bold mb-2 text-primary">{shops.length}</div>
                <p className="text-sm text-muted-foreground">
                  {isLoadingShops ? "Loading..." : "Active rental shops"}
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Admin Tools</h2>
                <div className="text-4xl font-bold mb-2 text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 inline-block"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">
                  Manage platform settings and data
                </p>
              </div>
            </div>

            {/* Recent Users */}
            <div className="mb-12">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Recent Users</h2>
                <Button variant="outline" asChild>
                  <Link href="/admin/users">View All Users</Link>
                </Button>
              </div>
              
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium">Name</th>
                        <th className="text-left px-4 py-3 text-sm font-medium">Email</th>
                        <th className="text-left px-4 py-3 text-sm font-medium">Role</th>
                        <th className="text-left px-4 py-3 text-sm font-medium">Joined</th>
                        <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {isLoadingUsers ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-center">
                            Loading users...
                          </td>
                        </tr>
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-center">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-4 py-3">
                              {user.first_name} {user.last_name}
                            </td>
                            <td className="px-4 py-3">{user.email}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                user.role === 'admin' 
                                  ? 'bg-primary/10 text-primary' 
                                  : user.role === 'shop_owner'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                asChild
                              >
                                <Link href={`/admin/users/${user.id}`}>
                                  View
                                </Link>
                              </Button>
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
            <div className="mb-12">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Recent Shops</h2>
                <Button variant="outline" asChild>
                  <Link href="/admin/shops">View All Shops</Link>
                </Button>
              </div>
              
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium">Shop Name</th>
                        <th className="text-left px-4 py-3 text-sm font-medium">Owner</th>
                        <th className="text-left px-4 py-3 text-sm font-medium">Location</th>
                        <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                        <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {isLoadingShops ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-center">
                            Loading shops...
                          </td>
                        </tr>
                      ) : shops.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-center">
                            No shops found
                          </td>
                        </tr>
                      ) : (
                        shops.map((shop) => (
                          <tr key={shop.id}>
                            <td className="px-4 py-3 font-medium">{shop.name}</td>
                            <td className="px-4 py-3">
                              {shop.users?.first_name} {shop.users?.last_name}
                            </td>
                            <td className="px-4 py-3">{shop.location}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                shop.is_verified 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {shop.is_verified ? 'Verified' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                asChild
                              >
                                <Link href={`/admin/shops/${shop.id}`}>
                                  View
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-3">User Management</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage users, roles, and permissions.
                </p>
                <Button className="w-full" asChild>
                  <Link href="/admin/users">Manage Users</Link>
                </Button>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-3">Shop Verification</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Review and approve rental shop applications.
                </p>
                <Button className="w-full" asChild>
                  <Link href="/admin/shops">Manage Shops</Link>
                </Button>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-3">Site Settings</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure platform settings and appearance.
                </p>
                <Button className="w-full" asChild>
                  <Link href="/admin/settings">Settings</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>
    </div>
  );
} 