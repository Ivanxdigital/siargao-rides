"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  CalendarDays,
  CheckCircle,
  Shield,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TestTube
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip";

// Sidebar item interface
interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  active: boolean;
  collapsed?: boolean;
}

// Sidebar item component with tooltip support for collapsed state
const SidebarItem = ({ href, icon, title, active, collapsed = false }: SidebarItemProps) => {
  const item = (
    <Link href={href} className="w-full">
      <Button
        variant={active ? "default" : "ghost"}
        size={collapsed ? "icon" : "default"}
        className={cn(
          "w-full transition-all duration-200",
          collapsed ? "justify-center p-2 h-10 w-10 rounded-full" : "justify-start gap-3 mb-1 px-4 py-2.5",
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "hover:bg-primary/10 hover:text-primary"
        )}
      >
        {icon}
        {!collapsed && <span>{title}</span>}
      </Button>
    </Link>
  );

  // If sidebar is collapsed, wrap item in tooltip
  if (collapsed) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            {item}
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-background/90 backdrop-blur-sm border-primary/20">
            {title}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return item;
};

// Layout animation variants
const layoutVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      when: "beforeChildren",
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -5 },
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
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      delay: 0.1
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
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar toggle
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop sidebar collapse

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
        className="min-h-screen bg-background flex items-center justify-center"
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
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {isSettingUp ? "Setting up your account..." : "Loading dashboard..."}
          </motion.div>
        </div>
      </motion.div>
    );
  }

  const isShopOwner = user?.user_metadata?.role === "shop_owner";
  const isAdmin = user?.user_metadata?.role === "admin";

  // Add scroll lock effect for mobile sidebar
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 768) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [sidebarOpen]);

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white relative"
      initial="hidden"
      animate="visible"
      variants={layoutVariants}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 z-0 opacity-15">
        <motion.div
          className="absolute inset-0 bg-[url('/grid.svg')] bg-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.07 }}
          transition={{ duration: 1 }}
        ></motion.div>
      </div>

      {/* Mobile sidebar toggle button */}
      <motion.button
        onClick={toggleSidebar}
        className="md:hidden fixed z-30 bottom-6 left-6 p-2.5 bg-black/50 hover:bg-primary/20 border border-primary/20 backdrop-blur-xl rounded-full shadow-md flex items-center justify-center transition-all duration-200"
        aria-label="Toggle navigation menu"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.2 }}
      >
        {sidebarOpen ? <X size={20} className="text-primary" /> : <Menu size={20} className="text-primary" />}
      </motion.button>

      <div className="flex h-screen w-full relative z-10 overflow-hidden pt-[60px]">
        {/* Sidebar Navigation */}
        <motion.aside
          className={cn(
            "fixed md:relative z-50 top-[60px] md:top-0 left-0 h-[calc(100vh-60px)] md:h-full bg-black border-r border-white/10 backdrop-blur-md transition-all duration-300 ease-in-out",
            isCollapsed ? "md:w-20" : "md:w-64",
            sidebarOpen ? "w-4/5 max-w-xs translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
          variants={itemVariants}
        >
          {/* Collapse toggle button (desktop only) */}
          <motion.button
            onClick={toggleCollapse}
            className="hidden md:flex absolute -right-3 top-16 z-30 h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md border border-primary/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </motion.button>

          <div className="h-full flex flex-col pt-6 pb-6 px-4 overflow-y-auto">
            {/* Logo/Brand */}
            <motion.div
              className={cn(
                "flex items-center py-3 mb-4",
                isCollapsed ? "justify-center" : "px-2"
              )}
              variants={itemVariants}
            >
              <Link href="/dashboard" className="flex items-center justify-center">
                <div className={cn(
                  "relative",
                  isCollapsed ? "h-8 w-8" : "h-9 w-9"
                )}>
                  <Image
                    src="/images/Logo only.png"
                    alt="Siargao Rides Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
            </motion.div>

            {/* User Profile */}
            <motion.div
              className={cn(
                "mb-5 pb-4 border-b border-white/10",
                isCollapsed ? "flex justify-center" : ""
              )}
              variants={itemVariants}
            >
              {isCollapsed ? (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-10 w-10 rounded-full border-2 border-primary/50 overflow-hidden shadow-md cursor-pointer">
                        {user?.user_metadata?.profile_picture ? (
                          <img
                            src={user.user_metadata.profile_picture}
                            alt="Profile"
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${user?.user_metadata?.first_name || "User"}&background=6d28d9&color=fff`;
                            }}
                          />
                        ) : (
                          <div className="h-full w-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                            {user?.user_metadata?.first_name ? user.user_metadata.first_name[0].toUpperCase() : "U"}
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-background/90 backdrop-blur-sm border-primary/20">
                      {user?.user_metadata?.first_name} {user?.user_metadata?.last_name || ""}
                      <div className="text-xs opacity-70">
                        {user?.user_metadata?.role === "shop_owner" ? "Shop Owner" :
                        user?.user_metadata?.role === "admin" ? "Administrator" : "Rider"}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <div className="flex items-center gap-3 px-2 py-1">
                  <div className="h-10 w-10 rounded-full border-2 border-primary/50 overflow-hidden shadow-md">
                    {user?.user_metadata?.profile_picture ? (
                      <img
                        src={user.user_metadata.profile_picture}
                        alt="Profile"
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${user?.user_metadata?.first_name || "User"}&background=6d28d9&color=fff`;
                        }}
                      />
                    ) : (
                      <div className="h-full w-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {user?.user_metadata?.first_name ? user.user_metadata.first_name[0].toUpperCase() : "U"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-medium truncate">
                      {user?.user_metadata?.first_name} {user?.user_metadata?.last_name || ""}
                    </h3>
                    <p className="text-xs text-white/60 truncate">
                      {user?.user_metadata?.role === "shop_owner" ? "Shop Owner" :
                      user?.user_metadata?.role === "admin" ? "Administrator" : "Rider"}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            <div className={cn(
              "flex-1 space-y-5 overflow-y-auto",
              "sm:space-y-5 space-y-7"
            )}>
              {/* Dashboard Navigation */}
              <div>
                {!isCollapsed && (
                  <motion.h2
                    className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2 px-4"
                    variants={itemVariants}
                  >
                    Dashboard
                  </motion.h2>
                )}
                <div className={cn("space-y-1", isCollapsed && "flex flex-col items-center", "sm:space-y-1 space-y-2")}>
                  <motion.div onClick={handleLinkClick} variants={itemVariants}>
                    <SidebarItem
                      href="/dashboard"
                      icon={<LayoutDashboard size={18} />}
                      title="Overview"
                      active={pathname === "/dashboard"}
                      collapsed={isCollapsed}
                    />
                  </motion.div>
                  <motion.div onClick={handleLinkClick} variants={itemVariants}>
                    <SidebarItem
                      href="/dashboard/my-bookings"
                      icon={<Calendar size={18} />}
                      title="My Bookings"
                      active={pathname.startsWith("/dashboard/my-bookings")}
                      collapsed={isCollapsed}
                    />
                  </motion.div>
                  <motion.div onClick={handleLinkClick} variants={itemVariants}>
                    <SidebarItem
                      href="/profile"
                      icon={<Settings size={18} />}
                      title="Profile Settings"
                      active={pathname === "/profile"}
                      collapsed={isCollapsed}
                    />
                  </motion.div>
                </div>
              </div>

              {/* Shop Owner Section */}
              {isShopOwner && (
                <div>
                  {!isCollapsed && (
                    <motion.h2
                      className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2 px-4"
                      variants={itemVariants}
                    >
                      Shop Management
                    </motion.h2>
                  )}
                  <div className={cn("space-y-1", isCollapsed && "flex flex-col items-center")}>
                    <motion.div onClick={handleLinkClick} variants={itemVariants}>
                      <SidebarItem
                        href="/dashboard/shop"
                        icon={<ShoppingBag size={18} />}
                        title="My Shop"
                        active={pathname === "/dashboard/shop"}
                        collapsed={isCollapsed}
                      />
                    </motion.div>
                    <motion.div onClick={handleLinkClick} variants={itemVariants}>
                      <SidebarItem
                        href="/dashboard/bookings"
                        icon={<Calendar size={18} />}
                        title="Manage Bookings"
                        active={pathname.startsWith("/dashboard/bookings")}
                        collapsed={isCollapsed}
                      />
                    </motion.div>
                    {!isCollapsed && pathname.startsWith("/dashboard/bookings") && (
                      <motion.div
                        className="pl-8 space-y-1 mb-1"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.2 }}
                      >
                        <Link
                          href="/dashboard/bookings"
                          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                            pathname === "/dashboard/bookings"
                              ? "bg-primary/20 text-primary"
                              : "text-white/70 hover:text-white hover:bg-white/10"
                          }`}
                          onClick={handleLinkClick}
                        >
                          <List size={16} />
                          <span>List View</span>
                        </Link>
                        <Link
                          href="/dashboard/bookings/calendar"
                          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                            pathname === "/dashboard/bookings/calendar"
                              ? "bg-primary/20 text-primary"
                              : "text-white/70 hover:text-white hover:bg-white/10"
                          }`}
                          onClick={handleLinkClick}
                        >
                          <CalendarDays size={16} />
                          <span>Calendar View</span>
                        </Link>
                      </motion.div>
                    )}
                    <motion.div onClick={handleLinkClick} variants={itemVariants}>
                      <SidebarItem
                        href="/dashboard/vehicles"
                        icon={<Car size={18} />}
                        title="Manage Vehicles"
                        active={pathname.startsWith("/dashboard/vehicles") || pathname.startsWith("/dashboard/bikes")}
                        collapsed={isCollapsed}
                      />
                    </motion.div>
                    <motion.div onClick={handleLinkClick} variants={itemVariants}>
                      <SidebarItem
                        href="/dashboard/analytics"
                        icon={<BarChart size={18} />}
                        title="Analytics"
                        active={pathname === "/dashboard/analytics"}
                        collapsed={isCollapsed}
                      />
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Admin Section */}
              {isAdmin && (
                <div>
                  {!isCollapsed && (
                    <motion.h2
                      className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2 px-4"
                      variants={itemVariants}
                    >
                      Administration
                    </motion.h2>
                  )}
                  <div className={cn("space-y-1", isCollapsed && "flex flex-col items-center")}>
                    <motion.div onClick={handleLinkClick} variants={itemVariants}>
                      <SidebarItem
                        href="/dashboard/admin"
                        icon={<Shield size={18} />}
                        title="Admin Dashboard"
                        active={pathname === "/dashboard/admin"}
                        collapsed={isCollapsed}
                      />
                    </motion.div>
                    <motion.div onClick={handleLinkClick} variants={itemVariants}>
                      <SidebarItem
                        href="/dashboard/admin/verification"
                        icon={<CheckCircle size={18} />}
                        title="Shop Verification"
                        active={pathname === "/dashboard/admin/verification"}
                        collapsed={isCollapsed}
                      />
                    </motion.div>
                    <motion.div onClick={handleLinkClick} variants={itemVariants}>
                      <SidebarItem
                        href="/dashboard/admin/deposit-payouts"
                        icon={<DollarSign size={18} />}
                        title="Deposit Payouts"
                        active={pathname === "/dashboard/admin/deposit-payouts"}
                        collapsed={isCollapsed}
                      />
                    </motion.div>
                    <motion.div onClick={handleLinkClick} variants={itemVariants}>
                      <SidebarItem
                        href="/dashboard/admin/settings"
                        icon={<Settings size={18} />}
                        title="Admin Settings"
                        active={pathname === "/dashboard/admin/settings"}
                        collapsed={isCollapsed}
                      />
                    </motion.div>
                    <motion.div onClick={handleLinkClick} variants={itemVariants}>
                      <SidebarItem
                        href="/dashboard/admin/test-accounts"
                        icon={<TestTube size={18} />}
                        title="Test Accounts"
                        active={pathname === "/dashboard/admin/test-accounts"}
                        collapsed={isCollapsed}
                      />
                    </motion.div>
                  </div>
                </div>
              )}
            </div>

            {/* Sign Out Button */}
            <div className={cn("pt-3 mt-auto", isCollapsed && "flex justify-center")}>
              {isCollapsed ? (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => signOut()}
                        className="h-10 w-10 rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <LogOut size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-background/90 backdrop-blur-sm border-red-500/20">
                      Sign Out
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-2.5"
                  onClick={() => signOut()}
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </Button>
              )}
            </div>
          </div>
        </motion.aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => {
              console.log('Overlay clicked, closing sidebar'); // Debug log
              toggleSidebar();
            }}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {/* Main Content */}
        <motion.main
          className={cn(
            "flex-1 p-3 sm:p-6 transition-all duration-300 overflow-auto",
            !isCollapsed ? "md:pl-8" : "md:pl-6"
          )}
          variants={contentVariants}
        >
          <div className="container mx-auto max-w-6xl bg-black/30 backdrop-blur-lg border border-white/5 rounded-xl p-5 shadow-lg">
            {children}
          </div>
        </motion.main>
      </div>
    </motion.div>
  );
}