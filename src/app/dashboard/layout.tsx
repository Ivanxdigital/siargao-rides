"use client";

import { useEffect, useState } from "react";
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
  UsersRound,
  Menu,
  X
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when clicking on a link (mobile)
  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

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
    <div className="min-h-screen bg-background pt-16 relative">
      {/* Mobile sidebar toggle button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed z-30 top-20 left-4 p-2 bg-primary/10 hover:bg-primary/20 border border-border backdrop-blur-sm rounded-full shadow-md flex items-center justify-center transition-all duration-200"
        aria-label="Toggle navigation menu"
      >
        {sidebarOpen ? <X size={20} className="text-primary" /> : <Menu size={20} className="text-primary" />}
      </button>

      <div className="container mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation - Hidden by default on mobile */}
        <aside className={cn(
          "fixed md:relative z-20 top-0 left-0 md:left-auto h-screen w-72 md:w-64 bg-background/95 md:bg-transparent pt-24 md:pt-0 px-5 md:px-0 shadow-xl md:shadow-none border-r border-border md:border-r-0 backdrop-blur-sm transition-all duration-300 ease-in-out transform md:transform-none shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
          <div className="sticky top-24 space-y-6">
            <div className="border-b border-border pb-4 md:border-b-0 md:pb-0">
              <h2 className="text-lg font-semibold mb-3">Dashboard</h2>
              <div className="space-y-1">
                <div onClick={handleLinkClick}>
                  <SidebarItem
                    href="/dashboard"
                    icon={<LayoutDashboard size={18} />}
                    title="Overview"
                    active={pathname === "/dashboard"}
                  />
                </div>
                <div onClick={handleLinkClick}>
                  <SidebarItem
                    href="/dashboard/bookings"
                    icon={<Calendar size={18} />}
                    title="My Bookings"
                    active={pathname === "/dashboard/bookings"}
                  />
                </div>
                <div onClick={handleLinkClick}>
                  <SidebarItem
                    href="/profile"
                    icon={<Settings size={18} />}
                    title="Profile Settings"
                    active={pathname === "/profile"}
                  />
                </div>
              </div>
            </div>

            {/* Shop Owner Section */}
            {isShopOwner && (
              <div className="border-b border-border pb-4 md:border-b-0 md:pb-0">
                <h2 className="text-lg font-semibold mb-3">Shop Management</h2>
                <div className="space-y-1">
                  <div onClick={handleLinkClick}>
                    <SidebarItem
                      href="/dashboard/shop"
                      icon={<ShoppingBag size={18} />}
                      title="My Shop"
                      active={pathname === "/dashboard/shop"}
                    />
                  </div>
                  <div onClick={handleLinkClick}>
                    <SidebarItem
                      href="/dashboard/bikes"
                      icon={<Bike size={18} />}
                      title="Manage Bikes"
                      active={pathname === "/dashboard/bikes"}
                    />
                  </div>
                  <div onClick={handleLinkClick}>
                    <SidebarItem
                      href="/dashboard/analytics"
                      icon={<BarChart size={18} />}
                      title="Analytics"
                      active={pathname === "/dashboard/analytics"}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Admin Section */}
            {isAdmin && (
              <div className="border-b border-border pb-4 md:border-b-0 md:pb-0">
                <h2 className="text-lg font-semibold mb-3">Administration</h2>
                <div className="space-y-1">
                  <div onClick={handleLinkClick}>
                    <SidebarItem
                      href="/admin"
                      icon={<UsersRound size={18} />}
                      title="Admin Panel"
                      active={pathname.startsWith("/admin")}
                    />
                  </div>
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

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden" 
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 pt-10 md:pt-0">{children}</main>
      </div>
    </div>
  );
} 