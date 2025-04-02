"use client"

import { useState } from "react"
import { Bike, Car, Truck } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { VehicleType } from "@/lib/types"
import { motion } from "framer-motion"

interface VehicleTypeSelectorProps {
  selectedType: VehicleType | 'all'
  onChange: (type: VehicleType | 'all') => void
  availableTypes?: VehicleType[]
  className?: string
}

const VehicleTypeSelector = ({
  selectedType,
  onChange,
  availableTypes = ['motorcycle', 'car', 'tuktuk'],
  className = ''
}: VehicleTypeSelectorProps) => {
  // Filter out unavailable types if specified
  const types: (VehicleType | 'all')[] = ['all', ...availableTypes]

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  }

  return (
    <motion.div 
      className={`flex flex-wrap gap-2 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {types.map((type) => (
        <motion.div
          key={type}
          variants={itemVariants}
        >
          <Button 
            variant={selectedType === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(type)}
            className="rounded-full"
          >
            {type === 'all' ? (
              'All Vehicles'
            ) : (
              <>
                {type === 'motorcycle' && <Bike size={14} className="mr-1.5" />}
                {type === 'car' && <Car size={14} className="mr-1.5" />}
                {type === 'tuktuk' && <Truck size={14} className="mr-1.5" />}
                {type.charAt(0).toUpperCase() + type.slice(1)}s
              </>
            )}
          </Button>
        </motion.div>
      ))}
    </motion.div>
  )
}

export default VehicleTypeSelector 