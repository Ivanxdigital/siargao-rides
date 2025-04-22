"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Edit, Trash, ToggleLeft, ToggleRight, Bike, Car, Truck, AlertCircle, Info } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "./ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

type VerificationStatus = 'pending' | 'approved' | 'rejected';

interface ManageVehicleCardProps {
  id: string;
  name: string;
  vehicleType: "motorcycle" | "car" | "tuktuk";
  images: string[];
  price: number;
  isAvailable: boolean;
  verificationStatus?: VerificationStatus;
  verificationNotes?: string;
  onEdit: (vehicleId: string) => void;
  onDelete: (vehicleId: string) => void;
  onToggleAvailability: (vehicleId: string, isAvailable: boolean) => void;
}

const ManageVehicleCard = ({
  id,
  name,
  vehicleType,
  images,
  price,
  isAvailable,
  verificationStatus = 'pending',
  verificationNotes,
  onEdit,
  onDelete,
  onToggleAvailability,
}: ManageVehicleCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Get the appropriate icon based on vehicle type
  const getVehicleIcon = () => {
    switch(vehicleType) {
      case 'car':
        return <Car size={16} className="mr-1 text-blue-400" />;
      case 'tuktuk':
        return <Truck size={16} className="mr-1 text-amber-400" />;
      case 'motorcycle':
      default:
        return <Bike size={16} className="mr-1 text-primary" />;
    }
  };

  // Get the verification badge based on status
  const getVerificationBadge = () => {
    switch(verificationStatus) {
      case 'approved':
        return (
          <Badge variant="verified" className="flex items-center ml-2">
            Verified
          </Badge>
        );
      case 'rejected':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className="flex items-center ml-2">
                  <AlertCircle size={12} className="mr-1" />
                  Rejected
                </Badge>
              </TooltipTrigger>
              {verificationNotes && (
                <TooltipContent>
                  <p className="max-w-xs text-xs">{verificationNotes}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        );
      case 'pending':
      default:
        return (
          <Badge variant="pending" className="flex items-center ml-2">
            <Info size={12} className="mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <Card className="overflow-hidden border border-border h-full flex flex-col">
      {/* Image Container */}
      <div className="relative aspect-[4/3] bg-muted">
        {images.length > 0 ? (
          <Image
            src={images[currentImageIndex]}
            alt={name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No image
          </div>
        )}

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                prevImage();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1"
              aria-label="Previous image"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                nextImage();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1"
              aria-label="Next image"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Availability Badge */}
        <div className="absolute top-2 right-2">
          <Badge variant={isAvailable ? "available" : "unavailable"}>
            {isAvailable ? "Available" : "Unavailable"}
          </Badge>
        </div>
        
        {/* Vehicle Type Badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="flex items-center capitalize">
            {getVehicleIcon()}
            {vehicleType}
          </Badge>
        </div>
      </div>

      {/* Vehicle Details */}
      <CardContent className="p-4 flex-grow">
        <div className="flex items-center mb-2">
          <h3 className="text-lg font-medium">{name}</h3>
          {getVerificationBadge()}
        </div>
        <p className="text-muted-foreground mb-2">
          ₱{price.toLocaleString()} / day
        </p>
      </CardContent>

      {/* Actions */}
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-primary hover:text-primary-foreground hover:bg-primary"
            onClick={() => onEdit(id)}
          >
            <Edit size={16} className="mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-white hover:bg-destructive/90 border border-transparent hover:border-destructive transition-colors"
            onClick={() => onDelete(id)}
          >
            <Trash size={16} className="mr-1" />
            Delete
          </Button>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onToggleAvailability(id, !isAvailable)}
          className={isAvailable ? "text-muted-foreground" : "text-primary"}
        >
          {isAvailable ? (
            <ToggleRight size={16} className="mr-1" />
          ) : (
            <ToggleLeft size={16} className="mr-1" />
          )}
          {isAvailable ? "Hide" : "Show"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ManageVehicleCard; 