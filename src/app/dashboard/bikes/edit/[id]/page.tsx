"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditBikeRedirect() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  
  useEffect(() => {
    // Redirect to the edit vehicle page with the same ID
    router.replace(`/dashboard/vehicles/edit/${id}`);
  }, [router, id]);
  
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="animate-pulse text-center">
        <h2 className="text-2xl font-semibold mb-2">Redirecting...</h2>
        <p className="text-gray-400">Edit Bike has been moved to Edit Vehicle</p>
      </div>
    </div>
  );
} 