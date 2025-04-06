import { LayoutDashboard, Store, Car, Users, Settings } from "lucide-react";

export const adminItems = [
  {
    title: "Dashboard",
    href: "/dashboard/admin",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Shop Verification",
    href: "/dashboard/admin/shops/verification",
    icon: <Store className="h-5 w-5" />,
  },
  {
    title: "Vehicle Verification",
    href: "/dashboard/admin/vehicles/verification",
    icon: <Car className="h-5 w-5" />,
  },
  {
    title: "Users",
    href: "/dashboard/admin/users",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/dashboard/admin/settings",
    icon: <Settings className="h-5 w-5" />,
  },
  // ... existing items ...
] 