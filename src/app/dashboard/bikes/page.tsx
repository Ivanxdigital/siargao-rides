"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BikePageRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the vehicles page
    router.replace("/dashboard/vehicles");
  }, [router]);
  
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="animate-pulse text-center">
        <h2 className="text-2xl font-semibold mb-2">Redirecting...</h2>
        <p className="text-gray-400">The Bikes section has been moved to Vehicles</p>
      </div>
    </div>
  );
} 