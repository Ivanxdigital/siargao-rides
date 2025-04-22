"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function RegistrationPromptBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    // Check if user is logged in and has shop_owner role
    if (!user) return;
    
    const checkRegistrationStatus = async () => {
      // Skip if user doesn't have shop_owner intent/role
      if (user.user_metadata?.role !== "shop_owner") return;
      
      const supabase = createClientComponentClient();
      
      // Check if user already has a shop registered
      const { data, error } = await supabase
        .from("rental_shops")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking shop registration:", error);
        return;
      }
      
      // If no shop exists, show the banner
      if (!data) {
        // Check if banner was dismissed in this session
        const dismissed = localStorage.getItem("registration_banner_dismissed");
        if (!dismissed) {
          setIsVisible(true);
        }
      }
    };
    
    checkRegistrationStatus();
  }, [user]);
  
  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    // Store dismissal in localStorage so it doesn't reappear immediately
    localStorage.setItem("registration_banner_dismissed", "true");
    
    // Animate out
    setTimeout(() => {
      setIsDismissed(true);
    }, 300);
  };
  
  if (!isVisible || isDismissed) return null;
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 inset-x-0 z-50 bg-gradient-to-r from-primary/80 to-blue-600/80 backdrop-blur-md text-white shadow-lg"
        >
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full p-1.5">
                <Info className="w-4 h-4" />
              </div>
              <p className="text-sm">
                Complete your shop registration to start listing vehicles!
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/register?form=true"
                className="text-xs bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-md font-medium"
              >
                Complete Registration
              </Link>
              <button onClick={handleDismiss} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 