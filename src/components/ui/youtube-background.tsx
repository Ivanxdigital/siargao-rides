'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface YouTubeBackgroundProps {
  videoId: string
  fallbackImage?: string
  className?: string
  children?: React.ReactNode
  showCredits?: boolean
  creditsText?: string
  creditsLink?: string
}

export default function YouTubeBackground({
  videoId,
  fallbackImage = '/images/background-GL.jpg',
  className,
  children,
  showCredits = false,
  creditsText,
  creditsLink
}: YouTubeBackgroundProps) {
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const videoContainerRef = useRef<HTMLDivElement>(null)

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  // Initialize the YouTube iframe after the component mounts (client-side only)
  useEffect(() => {
    if (!videoContainerRef.current || isMobile) return;

    // Clear out any existing content
    videoContainerRef.current.innerHTML = '';

    // Create iframe element
    const iframe = document.createElement('iframe');

    // Set attributes - improved for mobile compatibility
    iframe.className = 'absolute w-[150%] md:w-[120%] h-[150%] md:h-[120%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&rel=0&disablekb=1&modestbranding=1&showinfo=0`;
    iframe.title = 'YouTube Video Background';
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.setAttribute('playsinline', '1'); // Explicit for iOS
    iframe.setAttribute('webkit-playsinline', '1'); // For older iOS versions

    // Handle successful load
    iframe.onload = () => {
      setVideoLoaded(true);
      setVideoError(false);
    };

    // Handle error
    iframe.onerror = () => {
      console.error('YouTube iframe failed to load');
      setVideoError(true);
      setVideoLoaded(false);
    };

    // Append to container
    videoContainerRef.current.appendChild(iframe);

    // Set a timeout to check if video loaded successfully
    const timeoutId = setTimeout(() => {
      if (!videoLoaded) {
        console.warn('YouTube video did not load within timeout period');
        setVideoError(true);
      }
    }, 5000); // 5 second timeout

    return () => {
      clearTimeout(timeoutId);
    };
  }, [videoId, isMobile, videoLoaded]);

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      {/* Mobile Background - Static Image/Gradient */}
      <div className="absolute inset-0 z-0 md:hidden">
        <Image
          src={fallbackImage}
          alt="Background"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-black/50 to-purple-900/40 z-10"></div>
      </div>

      {/* Desktop Background - YouTube Video or Fallback */}
      <div className="absolute inset-0 w-full h-full hidden md:block">
        <div className="relative w-full h-full overflow-hidden">
          {videoError ? (
            /* Fallback Image when video fails to load */
            <div className="w-full h-full relative">
              <Image
                src={fallbackImage}
                alt="Background"
                fill
                className="object-cover"
                priority
              />
            </div>
          ) : (
            /* YouTube Video Container */
            <div ref={videoContainerRef} className="w-full h-full"></div>
          )}
        </div>
      </div>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/40 z-10"></div>

      {/* Credits - Desktop only */}
      {showCredits && creditsText && creditsLink && (
        <div className="absolute bottom-4 right-4 z-20 hidden md:block">
          <p className="text-xs text-white/50 font-light">
            Video by{' '}
            <a
              href={creditsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/70 transition-colors underline underline-offset-2 decoration-white/30"
            >
              {creditsText}
            </a>
          </p>
        </div>
      )}

      {/* Content */}
      <div className="relative z-20">
        {children}
      </div>
    </div>
  )
}