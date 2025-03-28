"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Bike, 
  Calendar, 
  Settings, 
  ShoppingBag, 
  BarChart, 
  LogOut,
  UsersRound
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  active: boolean;
}

const SidebarItem = ({ href, icon, title, active }: SidebarItemProps) => (
  <Link href={href} className="w-full">
    <Button
      variant={active ? "default" : "ghost"}
      className={cn(
        "w-full justify-start gap-3 mb-1",
        active ? "bg-primary text-primary-foreground" : ""
      )}
    >
      {icon}
      <span>{title}</span>
    </Button>
  </Link>
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const isShopOwner = user?.user_metadata?.role === "shop_owner";
  const isAdmin = user?.user_metadata?.role === "admin";

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-3">Dashboard</h2>
              <div className="space-y-1">
                <SidebarItem
                  href="/dashboard"
                  icon={<LayoutDashboard size={18} />}
                  title="Overview"
                  active={pathname === "/dashboard"}
                />
                <SidebarItem
                  href="/dashboard/bookings"
                  icon={<Calendar size={18} />}
                  title="My Bookings"
                  active={pathname === "/dashboard/bookings"}
                />
                <SidebarItem
                  href="/profile"
                  icon={<Settings size={18} />}
                  title="Profile Settings"
                  active={pathname === "/profile"}
                />
              </div>
            </div>

            {/* Shop Owner Section */}
            {isShopOwner && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Shop Management</h2>
                <div className="space-y-1">
                  <SidebarItem
                    href="/dashboard/shop"
                    icon={<ShoppingBag size={18} />}
                    title="My Shop"
                    active={pathname === "/dashboard/shop"}
                  />
                  <SidebarItem
                    href="/dashboard/bikes"
                    icon={<Bike size={18} />}
                    title="Manage Bikes"
                    active={pathname === "/dashboard/bikes"}
                  />
                  <SidebarItem
                    href="/dashboard/analytics"
                    icon={<BarChart size={18} />}
                    title="Analytics"
                    active={pathname === "/dashboard/analytics"}
                  />
                </div>
              </div>
            )}

            {/* Admin Section */}
            {isAdmin && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Administration</h2>
                <div className="space-y-1">
                  <SidebarItem
                    href="/admin"
                    icon={<UsersRound size={18} />}
                    title="Admin Panel"
                    active={pathname.startsWith("/admin")}
                  />
                </div>
              </div>
            )}

            {/* Sign Out */}
            <div className="pt-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 text-destructive"
                onClick={() => signOut()}
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
} 