"use client"

import React from "react"
import { Car, Bike, Truck, Fuel, Gauge, Users, Sliders, Key } from "lucide-react"
import { VehicleType } from "@/lib/types"

interface VehicleDetailsDisplayProps {
  vehicleType: VehicleType
  specifications?: Record<string, any>
  className?: string
  showIcons?: boolean
  showLabels?: boolean
  size?: "sm" | "md" | "lg"
  variant?: "grid" | "list"
  maxItems?: number
}

interface DetailItem {
  icon: React.ReactNode
  label: string
  value: string | number
  key: string
}

export function VehicleDetailsDisplay({
  vehicleType = "motorcycle",
  specifications = {},
  className = "",
  showIcons = true,
  showLabels = true,
  size = "md",
  variant = "list",
  maxItems = 4
}: VehicleDetailsDisplayProps) {
  // Set icon size based on the size prop
  const getIconSize = () => {
    switch (size) {
      case "sm": return 14
      case "lg": return 20
      case "md":
      default: return 16
    }
  }

  const iconSize = getIconSize()
  
  // Set text size class based on size prop
  const getTextSizeClass = () => {
    switch (size) {
      case "sm": return "text-xs"
      case "lg": return "text-base"
      case "md":
      default: return "text-sm"
    }
  }

  const textSizeClass = getTextSizeClass()
  
  // Get appropriate details based on vehicle type
  const getVehicleDetails = (): DetailItem[] => {
    const details: DetailItem[] = []
    
    switch (vehicleType) {
      case "car":
        if (specifications.transmission) {
          details.push({
            icon: <Key size={iconSize} />,
            label: "Transmission",
            value: specifications.transmission,
            key: "transmission"
          })
        }
        
        if (specifications.seats) {
          details.push({
            icon: <Users size={iconSize} />,
            label: "Seats",
            value: `${specifications.seats} seats`,
            key: "seats"
          })
        }
        
        if (specifications.fuel_type) {
          details.push({
            icon: <Fuel size={iconSize} />,
            label: "Fuel Type",
            value: specifications.fuel_type,
            key: "fuel_type"
          })
        }
        
        if (specifications.year) {
          details.push({
            icon: <Car size={iconSize} />,
            label: "Year",
            value: specifications.year,
            key: "year"
          })
        }
        
        if (specifications.air_conditioning !== undefined) {
          details.push({
            icon: <Sliders size={iconSize} />,
            label: "A/C",
            value: specifications.air_conditioning ? "Yes" : "No",
            key: "air_conditioning"
          })
        }
        break
        
      case "tuktuk":
        if (specifications.passenger_capacity) {
          details.push({
            icon: <Users size={iconSize} />,
            label: "Capacity",
            value: `${specifications.passenger_capacity} passengers`,
            key: "passenger_capacity"
          })
        }
        
        if (specifications.engine || specifications.engine_size) {
          details.push({
            icon: <Gauge size={iconSize} />,
            label: "Engine",
            value: specifications.engine || specifications.engine_size,
            key: "engine"
          })
        }
        
        if (specifications.fuel_type) {
          details.push({
            icon: <Fuel size={iconSize} />,
            label: "Fuel Type",
            value: specifications.fuel_type,
            key: "fuel_type"
          })
        }
        
        if (specifications.year) {
          details.push({
            icon: <Truck size={iconSize} />,
            label: "Year",
            value: specifications.year,
            key: "year"
          })
        }
        break
        
      case "motorcycle":
      default:
        if (specifications.engine || specifications.engine_size) {
          details.push({
            icon: <Gauge size={iconSize} />,
            label: "Engine",
            value: specifications.engine || specifications.engine_size,
            key: "engine"
          })
        }
        
        if (specifications.year) {
          details.push({
            icon: <Bike size={iconSize} />,
            label: "Year",
            value: specifications.year,
            key: "year"
          })
        }
        
        if (specifications.color) {
          details.push({
            icon: <div className="w-3 h-3 rounded-full bg-current" />,
            label: "Color",
            value: specifications.color,
            key: "color"
          })
        }
        
        if (specifications.transmission) {
          details.push({
            icon: <Key size={iconSize} />,
            label: "Transmission",
            value: specifications.transmission,
            key: "transmission"
          })
        }
        break
    }
    
    // Limit the number of items to display
    return details.slice(0, maxItems)
  }
  
  const details = getVehicleDetails()
  
  if (details.length === 0) {
    return null
  }
  
  // Render grid layout (2 columns)
  if (variant === "grid") {
    return (
      <div className={`grid grid-cols-2 gap-2 ${textSizeClass} ${className}`}>
        {details.map((detail) => (
          <div key={detail.key} className="flex items-center">
            {showIcons && (
              <span className="text-muted-foreground mr-1.5">
                {detail.icon}
              </span>
            )}
            <span className="capitalize">
              {showLabels ? (
                <span className="text-muted-foreground mr-1">{detail.label}:</span>
              ) : null}
              <span>{detail.value}</span>
            </span>
          </div>
        ))}
      </div>
    )
  }
  
  // Render list layout (vertical)
  return (
    <div className={`space-y-1 ${textSizeClass} ${className}`}>
      {details.map((detail) => (
        <div key={detail.key} className="flex justify-between">
          <span className="text-muted-foreground flex items-center">
            {showIcons && (
              <span className="mr-1.5">{detail.icon}</span>
            )}
            {showLabels ? detail.label : ""}
          </span>
          <span className="capitalize">{detail.value}</span>
        </div>
      ))}
    </div>
  )
} 