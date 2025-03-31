"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Edit, Trash, ToggleLeft, ToggleRight } from "lucide-react";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import {
  Card,
  CardContent,
  CardFooter,
} from "./ui/Card";

interface ManageBikeCardProps {
  id: string;
  model: string;
  images: string[];
  prices: {
    daily: number;
    weekly?: number;
    monthly?: number;
  };
  isAvailable: boolean;
  onEdit: (bikeId: string) => void;
  onDelete: (bikeId: string) => void;
  onToggleAvailability: (bikeId: string, isAvailable: boolean) => void;
}

export default function ManageBikeCard({
  id,
  model,
  images,
  prices,
  isAvailable,
  onEdit,
  onDelete,
  onToggleAvailability,
}: ManageBikeCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Debugging image URLs
  if (images && images.length > 0) {
    console.log("Image URL being displayed:", images[currentImageIndex]);
  }

  return (
    <Card className="overflow-hidden">
      {/* Image Gallery */}
      <div className="relative h-48 w-full">
        {images && images.length > 0 ? (
          <div className="relative h-full w-full">
            {/* Add placeholder as a background while the main image loads */}
            <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
              <p className="text-gray-400">Loading...</p>
            </div>
            <Image
              src={images[currentImageIndex]}
              alt={model}
              fill
              className="object-cover"
              onError={(e) => {
                console.error("Failed to load image:", images[currentImageIndex]);
                // Try using a direct URL format as fallback
                const imageUrl = images[currentImageIndex];
                // If the URL contains "supabase.co", try constructing a more direct URL
                if (imageUrl && imageUrl.includes("supabase.co")) {
                  try {
                    // Extract the path part after "public/"
                    const matches = imageUrl.match(/public\/([^"]+)/);
                    if (matches && matches[1]) {
                      const filename = matches[1];
                      // Reset the src with a placeholder
                      e.currentTarget.src = "https://placehold.co/600x400/1e3b8a/white?text=Bike+Image";
                    } else {
                      e.currentTarget.src = "https://placehold.co/600x400/1e3b8a/white?text=Bike+Image";
                    }
                  } catch (err) {
                    e.currentTarget.src = "https://placehold.co/600x400/1e3b8a/white?text=Bike+Image";
                  }
                } else {
                  e.currentTarget.src = "https://placehold.co/600x400/1e3b8a/white?text=Bike+Image";
                }
              }}
              unoptimized // Skip Next.js image optimization for Supabase URLs
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">No image available</p>
          </div>
        )}

        {/* Navigation Arrows - only show if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1"
              aria-label="Previous image"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1"
              aria-label="Next image"
            >
              <ChevronRight size={18} />
            </button>

            {/* Dots indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, index) => (
                <span
                  key={index}
                  className={`block w-1.5 h-1.5 rounded-full ${
                    index === currentImageIndex
                      ? "bg-primary"
                      : "bg-background/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Availability Badge */}
        <div className="absolute top-2 right-2">
          <Badge variant={isAvailable ? "available" : "unavailable"}>
            {isAvailable ? "Available" : "Not Available"}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="text-lg font-medium text-foreground mb-3">{model}</h3>

        {/* Pricing */}
        <div className="space-y-1 mb-4">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Daily:</span>
            <span className="font-medium">₱{prices.daily}</span>
          </div>

          {prices.weekly && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Weekly:</span>
              <span className="font-medium">₱{prices.weekly}</span>
            </div>
          )}

          {prices.monthly && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Monthly:</span>
              <span className="font-medium">₱{prices.monthly}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(id)}
          >
            <Edit size={16} className="mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-destructive border-destructive hover:bg-destructive/10"
            onClick={() => onDelete(id)}
          >
            <Trash size={16} className="mr-2" />
            Delete
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => onToggleAvailability(id, !isAvailable)}
        >
          {isAvailable ? (
            <>
              <ToggleRight size={16} className="mr-2 text-primary" />
              Mark as Unavailable
            </>
          ) : (
            <>
              <ToggleLeft size={16} className="mr-2" />
              Mark as Available
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 