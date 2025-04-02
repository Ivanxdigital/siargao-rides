"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AddBikeRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the add vehicle page
    router.replace("/dashboard/vehicles/add");
  }, [router]);
  
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="animate-pulse text-center">
        <h2 className="text-2xl font-semibold mb-2">Redirecting...</h2>
        <p className="text-gray-400">Add Bike has been moved to Add Vehicle</p>
      </div>
    </div>
  );
} 