"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  value?: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
  maxStars?: number;
  className?: string;
  id?: string;
}

export function RatingStars({
  value = 0,
  onChange,
  size = "md",
  readOnly = false,
  maxStars = 5,
  className,
  id
}: RatingStarsProps) {
  const [rating, setRating] = useState<number>(value);
  const [hoverRating, setHoverRating] = useState<number>(0);
  
  useEffect(() => {
    setRating(value);
  }, [value]);
  
  const handleSetRating = (newRating: number) => {
    if (readOnly) return;
    
    setRating(newRating);
    onChange?.(newRating);
  };
  
  // Size classes
  const sizeClasses = {
    sm: { star: "w-4 h-4", container: "gap-1" },
    md: { star: "w-5 h-5", container: "gap-1.5" },
    lg: { star: "w-6 h-6", container: "gap-2" }
  };
  
  return (
    <div 
      className={cn(
        "flex items-center", 
        sizeClasses[size].container,
        className
      )}
      id={id}
    >
      {Array.from({ length: maxStars }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = (hoverRating || rating) >= starValue;
        
        return (
          <button 
            key={`star-${i}`}
            type="button"
            className={cn(
              "transition-all duration-100 focus:outline-none",
              readOnly ? "cursor-default" : "cursor-pointer hover:scale-110",
              isFilled ? "text-yellow-400" : "text-gray-400"
            )}
            onClick={() => handleSetRating(starValue)}
            onMouseEnter={() => !readOnly && setHoverRating(starValue)}
            onMouseLeave={() => !readOnly && setHoverRating(0)}
            disabled={readOnly}
            aria-label={`${starValue} star${starValue !== 1 ? 's' : ''}`}
          >
            <Star
              className={cn(
                "fill-current transition-colors",
                sizeClasses[size].star
              )}
            />
          </button>
        );
      })}
    </div>
  );
} 