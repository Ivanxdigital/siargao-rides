"use client"

import { useState } from 'react'
import { ChevronDown, ChevronUp, Settings, Users, MoreVertical, Edit, Trash2, Package, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { VehicleGroupWithDetails, Vehicle } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'

interface GroupedVehicleCardProps {
  group: VehicleGroupWithDetails
  onExpand?: () => void
  onBulkAction?: (action: 'set-availability' | 'update-pricing' | 'block-dates', vehicleIds?: string[]) => void
  onEdit?: () => void
  onDelete?: () => void
  onViewVehicle?: (vehicleId: string) => void
}

export function GroupedVehicleCard({
  group,
  onExpand,
  onBulkAction,
  onEdit,
  onDelete,
  onViewVehicle
}: GroupedVehicleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
    onExpand?.()
  }

  const availablePercentage = group.total_count ? (group.available_count || 0) / group.total_count * 100 : 0

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Group Image */}
            {group.images && group.images.length > 0 && (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={group.images[0].image_url}
                  alt={group.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <Badge className="absolute bottom-1 right-1 text-xs" variant="secondary">
                  <Package className="w-3 h-3 mr-1" />
                  {group.total_count}
                </Badge>
              </div>
            )}

            {/* Group Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">{group.name}</h3>
                <Badge variant="outline" className="text-xs">
                  {group.vehicle_type_name}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {group.total_count} units
                </span>
                <span className="font-medium text-foreground">
                  {formatPrice(group.price_per_day || 0)}/day
                </span>
              </div>

              {/* Availability Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Availability</span>
                  <span className={`font-medium ${availablePercentage > 50 ? 'text-green-600' : availablePercentage > 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {group.available_count} of {group.total_count} available
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      availablePercentage > 50 ? 'bg-green-500' : 
                      availablePercentage > 20 ? 'bg-yellow-500' : 
                      'bg-red-500'
                    }`}
                    style={{ width: `${availablePercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              className="text-muted-foreground"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Expand
                </>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Group
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkAction?.('update-pricing')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Update Pricing
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onBulkAction?.('set-availability')}>
                  <Eye className="w-4 h-4 mr-2" />
                  Set All Available
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkAction?.('set-availability')}>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Set All Unavailable
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkAction?.('block-dates')}>
                  <Package className="w-4 h-4 mr-2" />
                  Block Dates
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0">
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Individual Units</h4>
                <div className="space-y-2">
                  {group.vehicles?.map((vehicle, index) => (
                    <VehicleUnitRow
                      key={vehicle.id}
                      vehicle={vehicle}
                      index={index}
                      onView={() => onViewVehicle?.(vehicle.id)}
                      onToggleAvailability={() => onBulkAction?.('set-availability', [vehicle.id])}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

interface VehicleUnitRowProps {
  vehicle: Vehicle
  index: number
  onView: () => void
  onToggleAvailability: () => void
}

function VehicleUnitRow({ vehicle, index, onView, onToggleAvailability }: VehicleUnitRowProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          #{index + 1}
        </span>
        <span className="text-sm font-medium">
          {vehicle.individual_identifier || `Unit ${index + 1}`}
        </span>
        {vehicle.license_plate && (
          <Badge variant="outline" className="text-xs">
            {vehicle.license_plate}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge
          variant={vehicle.is_available ? 'default' : 'secondary'}
          className={vehicle.is_available ? 'bg-green-100 text-green-800' : ''}
        >
          {vehicle.is_available ? 'Available' : 'Unavailable'}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={onView}
        >
          View
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleAvailability}
        >
          {vehicle.is_available ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  )
}