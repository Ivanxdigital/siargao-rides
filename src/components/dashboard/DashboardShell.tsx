"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bike, BarChart2, Store, User, Settings, LogOut, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { RegistrationPromptBanner } from "@/components/ui/RegistrationPromptBanner";

interface DashboardShellProps {
  children: React.ReactNode;
}

const DashboardShell: React.FC<DashboardShellProps> = ({ children }) => {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: BarChart2,
      current: pathname === "/dashboard",
    },
    {
      name: "My Shop",
      href: "/dashboard/shop",
      icon: Store, 
      current: pathname === "/dashboard/shop",
    },
    {
      name: "My Bikes",
      href: "/dashboard/bikes",
      icon: Bike,
      current: pathname === "/dashboard/bikes" || pathname?.startsWith("/dashboard/bikes/"),
    },
    {
      name: "Bookings",
      href: "/dashboard/bookings",
      icon: Calendar,
      current: pathname === "/dashboard/bookings" || pathname?.startsWith("/dashboard/bookings/"),
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: User,
      current: pathname === "/dashboard/profile",
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      current: pathname === "/dashboard/settings",
    },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      <div className="flex h-full">
        {/* Registration Prompt Banner */}
        <RegistrationPromptBanner />
        
        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 hidden w-64 overflow-y-auto border-r border-white/10 bg-black/20 backdrop-blur-md px-6 py-6 sm:flex flex-col">
          <div className="mb-8">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-xl font-bold">Siargao Rides</span>
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-1">
              {navigationItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium ${
                      item.current
                        ? "bg-primary text-white"
                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <item.icon
                      className={`h-5 w-5 shrink-0 ${
                        item.current
                          ? "text-white"
                          : "text-gray-400 group-hover:text-white"
                      }`}
                    />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-6">
              <button
                onClick={handleSignOut}
                className="group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-white" />
                Sign Out
              </button>
            </div>
          </nav>
        </div>

        {/* Mobile navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-white/10 bg-black/90 backdrop-blur-md p-2 sm:hidden">
          <nav className="flex justify-around">
            {navigationItems.slice(0, 5).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center p-2 rounded-md ${
                  item.current ? "text-primary" : "text-gray-400"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col sm:pl-64">
          <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardShell; 