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
  X,
  Car,
  List,
  CalendarDays
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";

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
        "w-full justify-start gap-3 mb-1 transition-all duration-300",
        active 
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
          : "hover:bg-primary/10 hover:text-primary"
      )}
    >
      {icon}
      <span>{title}</span>
    </Button>
  </Link>
);

// Layout animation variants
const layoutVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.5,
      when: "beforeChildren", 
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

const contentVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      delay: 0.2
    }
  }
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, isSettingUp, signOut } = useAuth();
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

  // Show loading state while checking authentication or setting up user
  if (isLoading || isSettingUp) {
    return (
      <motion.div 
        className="min-h-screen bg-gradient-to-b from-black to-gray-900 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center gap-3">
          <motion.div 
            className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          ></motion.div>
          <motion.div 
            className="text-primary/80 font-medium"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {isSettingUp ? "Setting up your account..." : "Loading dashboard..."}
          </motion.div>
        </div>
      </motion.div>
    );
  }

  const isShopOwner = user?.user_metadata?.role === "shop_owner";
  const isAdmin = user?.user_metadata?.role === "admin";

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white relative"
      initial="hidden"
      animate="visible"
      variants={layoutVariants}
    >
      {/* Background with enhanced overlay gradient */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-purple-900/20 to-blue-900/20"></div>
        <motion.div 
          className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 1 }}
        ></motion.div>
      </div>
      
      {/* Mobile sidebar toggle button */}
      <motion.button
        onClick={toggleSidebar}
        className="md:hidden fixed z-30 bottom-8 left-4 p-2 bg-black/40 hover:bg-primary/20 border border-primary/20 backdrop-blur-xl rounded-full shadow-lg shadow-primary/5 flex items-center justify-center transition-all duration-200"
        aria-label="Toggle navigation menu"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        {sidebarOpen ? <X size={20} className="text-primary" /> : <Menu size={20} className="text-primary" />}
      </motion.button>

      <div className="container mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row gap-8 relative z-10 pt-16 md:pt-24">
        {/* Sidebar Navigation - Hidden by default on mobile */}
        <motion.aside 
          className={cn(
            "fixed md:relative z-20 top-0 left-0 md:left-auto h-screen w-72 md:w-64 bg-black/60 md:bg-black/40 pt-24 md:pt-0 px-5 md:px-0 shadow-xl md:shadow-none border-r border-white/5 backdrop-blur-xl transition-all duration-300 ease-in-out transform md:transform-none shrink-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
          variants={itemVariants}
        >
          <div className="sticky top-24 space-y-8">
            <div className="pb-4">
              <motion.h2 
                className="text-lg font-medium mb-4 ml-3 text-white/80"
                variants={itemVariants}
              >
                Dashboard
              </motion.h2>
              <div className="space-y-1">
                <motion.div 
                  onClick={handleLinkClick}
                  variants={itemVariants}
                >
                  <SidebarItem
                    href="/dashboard"
                    icon={<LayoutDashboard size={18} />}
                    title="Overview"
                    active={pathname === "/dashboard"}
                  />
                </motion.div>
                <motion.div 
                  onClick={handleLinkClick}
                  variants={itemVariants}
                >
                  <SidebarItem
                    href="/profile"
                    icon={<Settings size={18} />}
                    title="Profile Settings"
                    active={pathname === "/profile"}
                  />
                </motion.div>
              </div>
            </div>

            {/* Shop Owner Section */}
            {isShopOwner && (
              <motion.div 
                className="pb-4"
                variants={itemVariants}
              >
                <h2 className="text-lg font-medium mb-4 ml-3 text-white/80">Shop Management</h2>
                <div className="space-y-1">
                  <motion.div 
                    onClick={handleLinkClick}
                    variants={itemVariants}
                  >
                    <SidebarItem
                      href="/dashboard/shop"
                      icon={<ShoppingBag size={18} />}
                      title="My Shop"
                      active={pathname === "/dashboard/shop"}
                    />
                  </motion.div>
                  <motion.div 
                    onClick={handleLinkClick}
                    variants={itemVariants}
                  >
                    <SidebarItem
                      href="/dashboard/bookings"
                      icon={<Calendar size={18} />}
                      title="Manage Bookings"
                      active={pathname.startsWith("/dashboard/bookings")}
                    />
                  </motion.div>
                  {pathname.startsWith("/dashboard/bookings") && (
                    <motion.div
                      className="pl-7 space-y-1 mt-1"
                      variants={itemVariants}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div onClick={handleLinkClick} variants={itemVariants}>
                        <SidebarItem
                          href="/dashboard/bookings"
                          icon={<List size={16} />}
                          title="List View"
                          active={pathname === "/dashboard/bookings"}
                        />
                      </motion.div>
                      <motion.div onClick={handleLinkClick} variants={itemVariants}>
                        <SidebarItem
                          href="/dashboard/bookings/calendar"
                          icon={<CalendarDays size={16} />}
                          title="Calendar View"
                          active={pathname === "/dashboard/bookings/calendar"}
                        />
                      </motion.div>
                    </motion.div>
                  )}
                  <motion.div 
                    onClick={handleLinkClick}
                    variants={itemVariants}
                  >
                    <SidebarItem
                      href="/dashboard/vehicles"
                      icon={<Car size={18} />}
                      title="Manage Vehicles"
                      active={pathname.startsWith("/dashboard/vehicles") || pathname.startsWith("/dashboard/bikes")}
                    />
                  </motion.div>
                  <motion.div 
                    onClick={handleLinkClick}
                    variants={itemVariants}
                  >
                    <SidebarItem
                      href="/dashboard/analytics"
                      icon={<BarChart size={18} />}
                      title="Analytics"
                      active={pathname === "/dashboard/analytics"}
                    />
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Admin Section */}
            {isAdmin && (
              <motion.div 
                className="pb-4"
                variants={itemVariants}
              >
                <h2 className="text-lg font-medium mb-4 ml-3 text-white/80">Administration</h2>
                <div className="space-y-1">
                  <motion.div 
                    onClick={handleLinkClick}
                    variants={itemVariants}
                  >
                    <SidebarItem
                      href="/admin"
                      icon={<UsersRound size={18} />}
                      title="Admin Panel"
                      active={pathname.startsWith("/admin")}
                    />
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Sign Out */}
            <motion.div 
              className="pt-4"
              variants={itemVariants}
            >
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={() => signOut()}
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </Button>
            </motion.div>
          </div>
        </motion.aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-10 md:hidden" 
            onClick={toggleSidebar}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {/* Main Content */}
        <motion.main 
          className="flex-1 pt-10 md:pt-4 bg-black/30 backdrop-blur-xl border border-white/10 rounded-xl p-4 md:p-6 shadow-lg shadow-primary/5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
          variants={contentVariants}
        >
          {children}
        </motion.main>
      </div>
    </motion.div>
  );
} 