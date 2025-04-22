"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Hook that scrolls to the top of the page when the route changes
 */
export const useScrollToTop = () => {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll to the top of the page on route change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant" // Use 'smooth' for animated scrolling, 'instant' for immediate
    });
  }, [pathname]); // Re-run when the pathname changes
};

export default useScrollToTop; 