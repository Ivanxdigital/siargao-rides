"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingBag,
  Car,
  Calendar,
  BarChart,
  Settings,
  LogOut,
  User,
  Shield,
  CheckCircle,
  DollarSign,
} from "lucide-react";

import {
  Sidebar,
  SidebarBody,
  SidebarLink,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface AceternityDashboardLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  isShopOwner?: boolean;
  signOut: () => void;
  user?: any;
}

export default function AceternityDashboardLayout({
  children,
  isAdmin = false,
  isShopOwner = false,
  signOut,
  user,
}: AceternityDashboardLayoutProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
  }, [isCollapsed]);

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Toggle collapse state on desktop
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Common navigation items
  const commonNavItems = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: <LayoutDashboard size={18} className={pathname === "/dashboard" ? "text-primary" : "text-white/70"} />,
      active: pathname === "/dashboard",
    },
    {
      label: "My Bookings",
      href: "/dashboard/my-bookings",
      icon: <Calendar size={18} className={pathname.startsWith("/dashboard/my-bookings") ? "text-primary" : "text-white/70"} />,
      active: pathname.startsWith("/dashboard/my-bookings"),
    },
    {
      label: "Profile Settings",
      href: "/profile",
      icon: <Settings size={18} className={pathname === "/profile" ? "text-primary" : "text-white/70"} />,
      active: pathname === "/profile",
    },
  ];

  // Shop owner navigation items
  const shopOwnerNavItems = isShopOwner ? [
    {
      label: "My Shop",
      href: "/dashboard/shop",
      icon: <ShoppingBag size={18} className={pathname === "/dashboard/shop" ? "text-primary" : "text-white/70"} />,
      active: pathname === "/dashboard/shop",
    },
    {
      label: "Manage Bookings",
      href: "/dashboard/bookings",
      icon: <Calendar size={18} className={pathname.startsWith("/dashboard/bookings") ? "text-primary" : "text-white/70"} />,
      active: pathname.startsWith("/dashboard/bookings"),
    },
    {
      label: "Manage Vehicles",
      href: "/dashboard/vehicles",
      icon: <Car size={18} className={pathname.startsWith("/dashboard/vehicles") || pathname.startsWith("/dashboard/bikes") ? "text-primary" : "text-white/70"} />,
      active: pathname.startsWith("/dashboard/vehicles") || pathname.startsWith("/dashboard/bikes"),
    },
    {
      label: "Analytics",
      href: "/dashboard/analytics",
      icon: <BarChart size={18} className={pathname === "/dashboard/analytics" ? "text-primary" : "text-white/70"} />,
      active: pathname === "/dashboard/analytics",
    },
  ] : [];

  // Admin navigation items
  const adminNavItems = isAdmin ? [
    {
      label: "Admin Dashboard",
      href: "/dashboard/admin",
      icon: <Shield size={18} className={pathname === "/dashboard/admin" ? "text-primary" : "text-white/70"} />,
      active: pathname === "/dashboard/admin",
    },
    {
      label: "Shop Verification",
      href: "/dashboard/admin/verification",
      icon: <CheckCircle size={18} className={pathname === "/dashboard/admin/verification" ? "text-primary" : "text-white/70"} />,
      active: pathname === "/dashboard/admin/verification",
    },
    {
      label: "Deposit Payouts",
      href: "/dashboard/admin/deposit-payouts",
      icon: <DollarSign size={18} className={pathname === "/dashboard/admin/deposit-payouts" ? "text-primary" : "text-white/70"} />,
      active: pathname === "/dashboard/admin/deposit-payouts",
    },
    {
      label: "Admin Settings",
      href: "/dashboard/admin/settings",
      icon: <Settings size={18} className={pathname === "/dashboard/admin/settings" ? "text-primary" : "text-white/70"} />,
      active: pathname === "/dashboard/admin/settings",
    },
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      <Sidebar open={!isCollapsed} setOpen={(open) => setIsCollapsed(!open)}>
        <SidebarBody className="pt-[60px]">
          <div className="flex flex-col h-full">
            {/* Logo/Brand */}
            <div className="mb-8 flex items-center justify-center md:justify-start">
              <Link href="/dashboard" className="flex items-center">
                <span className="text-xl font-bold text-white">Siargao Rides</span>
              </Link>
            </div>

            {/* User Profile */}
            <div className="mb-6 flex flex-col items-center">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-primary/30">
                {user?.user_metadata?.avatar_url ? (
                  <Image
                    src={user.user_metadata.avatar_url}
                    alt="User Avatar"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/20 text-primary">
                    <User size={24} />
                  </div>
                )}
              </div>
              <motion.div
                animate={{
                  opacity: !isCollapsed ? 1 : 0,
                  height: !isCollapsed ? "auto" : 0,
                }}
                className="mt-2 text-center overflow-hidden"
              >
                <p className="font-medium text-white">
                  {user?.user_metadata?.first_name || "User"}
                </p>
                <p className="text-xs text-white/60">
                  {user?.email || ""}
                </p>
              </motion.div>
            </div>

            {/* Navigation Sections */}
            <div className="flex flex-col space-y-6 flex-1">
              {/* Common Navigation */}
              <div>
                <motion.h2
                  animate={{
                    opacity: !isCollapsed ? 1 : 0,
                    height: !isCollapsed ? "auto" : 0,
                  }}
                  className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2 px-4"
                >
                  Navigation
                </motion.h2>
                <div className="space-y-1">
                  {commonNavItems.map((item) => (
                    <SidebarLink
                      key={item.href}
                      link={item}
                      active={item.active}
                    />
                  ))}
                </div>
              </div>

              {/* Shop Owner Navigation */}
              {isShopOwner && shopOwnerNavItems.length > 0 && (
                <div>
                  <motion.h2
                    animate={{
                      opacity: !isCollapsed ? 1 : 0,
                      height: !isCollapsed ? "auto" : 0,
                    }}
                    className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2 px-4"
                  >
                    Shop Management
                  </motion.h2>
                  <div className="space-y-1">
                    {shopOwnerNavItems.map((item) => (
                      <SidebarLink
                        key={item.href}
                        link={item}
                        active={item.active}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Navigation */}
              {isAdmin && adminNavItems.length > 0 && (
                <div>
                  <motion.h2
                    animate={{
                      opacity: !isCollapsed ? 1 : 0,
                      height: !isCollapsed ? "auto" : 0,
                    }}
                    className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2 px-4"
                  >
                    Administration
                  </motion.h2>
                  <div className="space-y-1">
                    {adminNavItems.map((item) => (
                      <SidebarLink
                        key={item.href}
                        link={item}
                        active={item.active}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sign Out Button */}
              <div className="mt-auto pt-6">
                <SidebarLink
                  link={{
                    label: "Sign Out",
                    href: "#",
                    icon: <LogOut size={18} className="text-white/70" />,
                  }}
                  className="hover:text-red-400"
                  {...{onClick: signOut}}
                />
              </div>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <div className="flex flex-1 flex-col md:pl-[60px] transition-all duration-300">
        <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
