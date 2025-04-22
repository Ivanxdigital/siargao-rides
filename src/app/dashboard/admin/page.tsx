"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Car, Users, Store, Settings, Plus, Trash2, X, Loader2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [shops, setShops] = useState<any[]>([]);
  const [pendingShops, setPendingShops] = useState<number>(0);
  const [pendingVehicles, setPendingVehicles] = useState<number>(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  
  // New user form state
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserRole, setNewUserRole] = useState("tourist");

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  // Fetch users
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchUsers();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      // Fetch recent users for the table
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching users:", error.message || error);
        toast.error("Failed to load users");
      } else {
        setUsers(data || []);
      }

      // Fetch total count of all users
      const { data: allUserIds, error: countError } = await supabase
        .from('users')
        .select('id');
      
      if (countError) {
        console.error("Error fetching user count:", countError.message || countError);
      } else {
        setTotalUsersCount(allUserIds?.length || 0);
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Error fetching users:", errorMessage);
      toast.error("An error occurred while fetching users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Create a new user
  const createUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserFirstName || !newUserLastName) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsCreatingUser(true);
    try {
      // Call the API endpoint to create a user
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          firstName: newUserFirstName,
          lastName: newUserLastName,
          role: newUserRole
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      toast.success("User created successfully");
      fetchUsers(); // Refresh the user list
      
      // Reset form and close dialog
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserFirstName("");
      setNewUserLastName("");
      setNewUserRole("tourist");
      setShowAddUserDialog(false);
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Delete a user
  const deleteUser = async () => {
    if (!userToDelete) return;

    setIsDeletingUser(true);
    try {
      // Call the API endpoint to delete a user
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userToDelete.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      toast.success("User deleted successfully");
      fetchUsers(); // Refresh the user list
      setShowDeleteDialog(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Handle opening delete dialog
  const handleDeleteClick = (user: any) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

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

            // Count pending shops
            const pending = data?.filter(shop => !shop.is_verified) || [];
            setPendingShops(pending.length);
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

  // Fetch pending vehicles count
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      const fetchPendingVehicles = async () => {
        setIsLoadingVehicles(true);
        try {
          const { data, error } = await supabase
            .from("vehicles")
            .select("id")
            .eq("verification_status", "pending");

          if (error) {
            console.error("Error fetching pending vehicles:", error.message || error);
          } else {
            setPendingVehicles(data?.length || 0);
          }
        } catch (error: any) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error("Error fetching pending vehicles:", errorMessage);
        } finally {
          setIsLoadingVehicles(false);
        }
      };

      fetchPendingVehicles();
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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold text-white/90">Users</h2>
          </div>
          <div className="text-4xl font-bold mb-2 text-primary">{totalUsersCount}</div>
          <p className="text-sm text-white/60">
            {isLoadingUsers ? "Loading..." : "Registered users on the platform"}
          </p>
        </div>

        <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Store className="h-5 w-5 text-green-500" />
            </div>
            <h2 className="text-lg font-semibold text-white/90">Shops</h2>
          </div>
          <div className="text-4xl font-bold mb-2 text-primary">{shops.length}</div>
          <div className="flex justify-between">
            <p className="text-sm text-white/60">
              {isLoadingShops ? "Loading..." : "Active rental shops"}
            </p>
            {pendingShops > 0 && (
              <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full">
                {pendingShops} pending
              </span>
            )}
          </div>
        </div>

        <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Car className="h-5 w-5 text-purple-500" />
            </div>
            <h2 className="text-lg font-semibold text-white/90">Vehicles</h2>
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-4xl font-bold text-primary">
              {isLoadingVehicles ? "..." : pendingVehicles}
            </div>
            <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full">
              Pending verification
            </span>
          </div>
          <p className="text-sm text-white/60 mb-4">
            Vehicles awaiting approval or rejection
          </p>
          <Button asChild className="w-full">
            <Link href="/dashboard/admin/vehicles/verification">Verify Vehicles</Link>
          </Button>
        </div>
      </div>

      {/* Admin Tools */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-white/90 mb-4">Admin Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

          <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Store className="h-5 w-5 text-green-500" />
              </div>
              <h3 className="text-lg font-medium text-white/90">Shop Verification</h3>
            </div>
            <p className="text-sm text-white/60 mb-4">
              Approve or reject new rental shop registrations
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/admin/shops/verification">Verify Shops</Link>
            </Button>
          </div>

          <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Car className="h-5 w-5 text-purple-500" />
              </div>
              <h3 className="text-lg font-medium text-white/90">Vehicle Verification</h3>
            </div>
            <p className="text-sm text-white/60 mb-4">
              Review and approve vehicle listings and documents
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/admin/vehicles/verification">Verify Vehicles</Link>
            </Button>
          </div>

          <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Settings className="h-5 w-5 text-cyan-500" />
              </div>
              <h3 className="text-lg font-medium text-white/90">System Settings</h3>
            </div>
            <p className="text-sm text-white/60 mb-4">
              Configure global platform settings and payment options
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/admin/settings">Manage Settings</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white/90">Recent Users</h2>
          <Button 
            onClick={() => setShowAddUserDialog(true)} 
            size="sm" 
            className="gap-1 flex items-center"
          >
            <Plus className="h-4 w-4" />
            Add User
          </Button>
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
                  <th className="text-right px-4 py-3 text-sm font-medium text-white/70">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {isLoadingUsers ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-center text-white/60">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-center text-white/60">
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
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(user)}
                          disabled={user.role === "admin"} // Prevent deleting admin users
                          className={
                            user.role === "admin" 
                              ? "opacity-30 cursor-not-allowed" 
                              : "text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="sm:max-w-[425px] bg-black/90 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account on the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@example.com"
                className="bg-black/50 border-white/10"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-black/50 border-white/10"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={newUserFirstName}
                  onChange={(e) => setNewUserFirstName(e.target.value)}
                  placeholder="John"
                  className="bg-black/50 border-white/10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={newUserLastName}
                  onChange={(e) => setNewUserLastName(e.target.value)}
                  placeholder="Doe"
                  className="bg-black/50 border-white/10"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger className="bg-black/50 border-white/10">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/10">
                  <SelectItem value="tourist">Tourist</SelectItem>
                  <SelectItem value="shop_owner">Shop Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createUser} 
              disabled={isCreatingUser || !newUserEmail || !newUserPassword || !newUserFirstName || !newUserLastName}
              className="gap-2"
            >
              {isCreatingUser && <Loader2 className="h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px] bg-black/90 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {userToDelete && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-md p-4 my-2">
              <p className="mb-1 text-white">
                <span className="font-medium">Name:</span> {userToDelete.first_name || ''} {userToDelete.last_name || ''}
              </p>
              <p className="mb-1 text-white">
                <span className="font-medium">Email:</span> {userToDelete.email}
              </p>
              <p className="text-white">
                <span className="font-medium">Role:</span> {userToDelete.role}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={deleteUser} 
              disabled={isDeletingUser}
              className="gap-2"
            >
              {isDeletingUser && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}