import { useState, useEffect } from 'react';

/**
 * Custom hook to check if the current viewport matches a media query
 * @param query Media query string (e.g., "(max-width: 640px)")
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Default to false for SSR
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Create media query list
    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);
    
    // Define callback for media query changes
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Add listener
    media.addEventListener('change', listener);
    
    // Cleanup listener on unmount
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
} 