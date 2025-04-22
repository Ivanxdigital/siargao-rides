"use client";

import { useScrollToTop } from "@/hooks/useScrollToTop";

/**
 * Component that scrolls to the top of the page when the route changes.
 * This is a "headless" component - it doesn't render anything visible.
 */
export const ScrollToTop = () => {
  // Use the hook to scroll to top on route change
  useScrollToTop();
  
  // This component doesn't render anything
  return null;
};

export default ScrollToTop; 