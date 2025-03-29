"use client";

import Image from "next/image";
import { User2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ src, alt = "User avatar", size = 'md', className }: AvatarProps) {
  // Define size in pixels
  const dimensions = {
    sm: 32,
    md: 40,
    lg: 96,
  };

  const sizeInPixels = dimensions[size];
  
  return (
    <div 
      className={cn(
        "rounded-full overflow-hidden bg-muted flex items-center justify-center",
        {
          'h-8 w-8': size === 'sm',
          'h-10 w-10': size === 'md',
          'h-24 w-24': size === 'lg',
        },
        className
      )}
    >
      {src ? (
        <Image 
          src={src} 
          alt={alt} 
          width={sizeInPixels} 
          height={sizeInPixels} 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="text-muted-foreground">
          <User2 
            size={size === 'lg' ? 40 : size === 'md' ? 24 : 16} 
            className="opacity-70" 
          />
        </div>
      )}
    </div>
  );
} 