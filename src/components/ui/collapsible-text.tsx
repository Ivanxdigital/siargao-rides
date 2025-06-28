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
      <div className="relative">
        {/* Collapsed state */}
        {!isExpanded && (
          <div className="relative">
            <div className="relative">
              {formatTextWithLineBreaks(truncatedText)}
              {/* Fade gradient effect */}
              <div className="absolute bottom-0 right-0 w-16 h-6 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none" />
            </div>
          </div>
        )}
        
        {/* Expanded state */}
        {isExpanded && (
          <div>
            {formatTextWithLineBreaks(text)}
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          mt-2 text-sm font-medium transition-colors duration-200 
          hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-gray-900 
          inline-flex items-center gap-1
          ${isExpanded 
            ? `text-gray-400 hover:text-gray-300 ${showLessClassName}` 
            : `text-primary hover:text-primary/80 ${readMoreClassName}`
          }
        `}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Show less text" : "Show more text"}
      >
        {isExpanded ? "Show less" : "Read more"}
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  )
}