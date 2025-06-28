"use client"

import { useState } from "react"
import { formatTextWithLineBreaks } from "@/lib/utils"

interface CollapsibleTextProps {
  text: string
  maxLength?: number
  className?: string
  readMoreClassName?: string
  showLessClassName?: string
}

export function CollapsibleText({
  text,
  maxLength = 180,
  className = "",
  readMoreClassName = "",
  showLessClassName = ""
}: CollapsibleTextProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // If text is shorter than maxLength, show it all without toggle
  if (text.length <= maxLength) {
    return (
      <div className={className}>
        {formatTextWithLineBreaks(text)}
      </div>
    )
  }

  // Find the last space before maxLength to avoid cutting words
  const truncateIndex = text.lastIndexOf(' ', maxLength)
  const truncatedText = truncateIndex > 0 ? text.slice(0, truncateIndex) : text.slice(0, maxLength)

  return (
    <div className={className}>
      {/* Content container with smooth max-height animation */}
      <div 
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded ? '500px' : '4.5rem' // ~3 lines for collapsed state
        }}
      >
        <div className="relative">
          {/* Always render full text for smooth animation */}
          <div className="leading-relaxed">
            {formatTextWithLineBreaks(text)}
          </div>
          
          {/* Fade gradient overlay - smoothly fades out when expanding */}
          <div 
            className={`
              absolute bottom-0 right-0 w-16 h-6 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none
              transition-opacity duration-300 ease-in-out
              ${isExpanded ? 'opacity-0' : 'opacity-100'}
            `}
          />
        </div>
      </div>

      {/* Toggle button with coordinated timing */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          mt-2 text-sm font-medium transition-all duration-300 ease-in-out
          hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-gray-900 
          inline-flex items-center gap-1 group
          ${isExpanded 
            ? `text-gray-400 hover:text-gray-300 ${showLessClassName}` 
            : `text-primary hover:text-primary/80 ${readMoreClassName}`
          }
        `}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Show less text" : "Show more text"}
      >
        <span className="transition-all duration-300 ease-in-out">
          {isExpanded ? "Show less" : "Read more"}
        </span>
        <svg
          className={`
            w-3 h-3 transition-transform duration-300 ease-in-out transform
            ${isExpanded ? 'rotate-180' : 'rotate-0'}
            group-hover:scale-110
          `}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Respect reduced motion preferences */}
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .transition-all,
          .transition-opacity,
          .transition-transform {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  )
}