"use client"

import { useState } from "react"
import { MapPin, Search, Navigation, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Location {
  id: string
  name: string
  description?: string
  category: 'airport' | 'town' | 'beach' | 'accommodation' | 'custom'
  coordinates?: {
    lat: number
    lng: number
  }
  estimatedTime?: {
    fromAirport: number // minutes
    fromGeneralLuna: number
  }
}

interface LocationPickerProps {
  type: 'pickup' | 'dropoff'
  value: string
  customValue?: string
  onLocationChange: (locationId: string) => void
  onCustomLocationChange?: (address: string) => void
  onInstructionsChange?: (instructions: string) => void
  instructions?: string
  label: string
  placeholder?: string
  showInstructions?: boolean
}

const popularLocations: Location[] = [
  {
    id: 'sayak-airport',
    name: 'Sayak Airport',
    description: 'Main airport terminal',
    category: 'airport',
    coordinates: { lat: 9.859461, lng: 126.017731 },
    estimatedTime: { fromAirport: 0, fromGeneralLuna: 45 }
  },
  {
    id: 'general-luna',
    name: 'General Luna',
    description: 'Tourist town center',
    category: 'town',
    coordinates: { lat: 9.802778, lng: 126.152778 },
    estimatedTime: { fromAirport: 45, fromGeneralLuna: 0 }
  },
  {
    id: 'cloud-9',
    name: 'Cloud 9',
    description: 'Famous surfing beach',
    category: 'beach',
    coordinates: { lat: 9.800556, lng: 126.157222 },
    estimatedTime: { fromAirport: 35, fromGeneralLuna: 10 }
  },
  {
    id: 'pacifico',
    name: 'Pacifico',
    description: 'Remote beach area',
    category: 'beach',
    coordinates: { lat: 9.653889, lng: 126.124167 },
    estimatedTime: { fromAirport: 75, fromGeneralLuna: 90 }
  },
  {
    id: 'dapa',
    name: 'Dapa',
    description: 'Port town',
    category: 'town',
    coordinates: { lat: 9.761944, lng: 126.050833 },
    estimatedTime: { fromAirport: 25, fromGeneralLuna: 35 }
  },
  {
    id: 'burgos',
    name: 'Burgos',
    description: 'Northeastern town',
    category: 'town',
    coordinates: { lat: 9.833333, lng: 126.050000 },
    estimatedTime: { fromAirport: 30, fromGeneralLuna: 60 }
  },
  {
    id: 'catangnan',
    name: 'Catangnan',
    description: 'Northern beach area',
    category: 'beach',
    coordinates: { lat: 9.883333, lng: 126.116667 },
    estimatedTime: { fromAirport: 40, fromGeneralLuna: 70 }
  },
  {
    id: 'sugba-lagoon',
    name: 'Sugba Lagoon',
    description: 'Island lagoon destination',
    category: 'beach',
    coordinates: { lat: 9.795000, lng: 126.105000 },
    estimatedTime: { fromAirport: 50, fromGeneralLuna: 25 }
  }
]

const accommodationAreas = [
  { id: 'gl-center', name: 'General Luna Center', description: 'Main tourist area' },
  { id: 'gl-beach', name: 'General Luna Beach', description: 'Beachfront accommodations' },
  { id: 'cloud9-area', name: 'Cloud 9 Area', description: 'Near the famous surf spot' },
  { id: 'pacifico-resorts', name: 'Pacifico Resorts', description: 'Luxury resort area' },
  { id: 'dapa-hotels', name: 'Dapa Hotels', description: 'Port town accommodations' }
]

export default function LocationPicker({
  type,
  value,
  customValue = '',
  onLocationChange,
  onCustomLocationChange,
  onInstructionsChange,
  instructions = '',
  label,
  placeholder,
  showInstructions = false
}: LocationPickerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(value === 'custom')

  const filteredLocations = popularLocations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedLocation = popularLocations.find(loc => loc.id === value)

  const handleLocationSelect = (locationId: string) => {
    if (locationId === 'custom') {
      setShowCustomInput(true)
    } else {
      setShowCustomInput(false)
    }
    onLocationChange(locationId)
  }

  const getCategoryIcon = (category: Location['category']) => {
    switch (category) {
      case 'airport':
        return '✈️'
      case 'town':
        return '🏘️'
      case 'beach':
        return '🏖️'
      case 'accommodation':
        return '🏨'
      default:
        return '📍'
    }
  }

  const getCategoryColor = (category: Location['category']) => {
    switch (category) {
      case 'airport':
        return 'text-blue-400'
      case 'town':
        return 'text-green-400'
      case 'beach':
        return 'text-cyan-400'
      case 'accommodation':
        return 'text-purple-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`${type}-location`} className="text-sm font-medium">
          {label}
        </Label>
        
        {/* Quick Select Dropdown */}
        <Select value={value} onValueChange={handleLocationSelect}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder={placeholder || `Select ${type} location`} />
          </SelectTrigger>
          <SelectContent>
            {/* Popular Locations */}
            <div className="px-2 py-1 text-xs font-semibold text-white/70 uppercase tracking-wide">
              Popular Locations
            </div>
            {popularLocations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCategoryIcon(location.category)}</span>
                  <div>
                    <div className="font-medium">{location.name}</div>
                    {location.description && (
                      <div className="text-xs text-white/60">{location.description}</div>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
            
            {/* Accommodation Areas */}
            <div className="px-2 py-1 text-xs font-semibold text-white/70 uppercase tracking-wide border-t border-zinc-600 mt-2 pt-2">
              Accommodation Areas
            </div>
            {accommodationAreas.map((area) => (
              <SelectItem key={area.id} value={area.id}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏨</span>
                  <div>
                    <div className="font-medium">{area.name}</div>
                    <div className="text-xs text-white/60">{area.description}</div>
                  </div>
                </div>
              </SelectItem>
            ))}
            
            {/* Custom Option */}
            <div className="px-2 py-1 text-xs font-semibold text-white/70 uppercase tracking-wide border-t border-zinc-600 mt-2 pt-2">
              Other
            </div>
            <SelectItem value="custom">
              <div className="flex items-center gap-2">
                <span className="text-lg">📍</span>
                <div>
                  <div className="font-medium">Custom Address</div>
                  <div className="text-xs text-white/60">Enter specific address</div>
                </div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Selected Location Info */}
      {selectedLocation && !showCustomInput && (
        <Card className="bg-zinc-700/50 border-zinc-600">
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{getCategoryIcon(selectedLocation.category)}</span>
              <div className="flex-1">
                <h4 className="font-medium">{selectedLocation.name}</h4>
                {selectedLocation.description && (
                  <p className="text-sm text-white/70">{selectedLocation.description}</p>
                )}
                {selectedLocation.estimatedTime && (
                  <div className="flex gap-4 mt-2 text-xs text-white/60">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {selectedLocation.estimatedTime.fromAirport}min from airport
                    </span>
                    <span className="flex items-center gap-1">
                      <Navigation className="h-3 w-3" />
                      {selectedLocation.estimatedTime.fromGeneralLuna}min from General Luna
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Address Input */}
      {showCustomInput && (
        <div className="space-y-3">
          <div>
            <Label htmlFor={`${type}-custom`} className="text-sm font-medium">
              Specific Address
            </Label>
            <Input
              id={`${type}-custom`}
              value={customValue}
              onChange={(e) => onCustomLocationChange?.(e.target.value)}
              placeholder="Enter the specific address or landmark"
              className="mt-1"
            />
          </div>
          <div className="text-xs text-white/60 bg-zinc-800 p-3 rounded-lg">
            <strong>Tip:</strong> Please provide detailed instructions including:
            <ul className="mt-1 ml-4 list-disc space-y-1">
              <li>Resort or hotel name</li>
              <li>Street name or barangay</li>
              <li>Nearby landmarks</li>
              <li>Contact number for coordination</li>
            </ul>
          </div>
        </div>
      )}

      {/* Pickup Instructions */}
      {showInstructions && (
        <div>
          <Label htmlFor={`${type}-instructions`} className="text-sm font-medium">
            {type === 'pickup' ? 'Pickup Instructions' : 'Dropoff Instructions'} (Optional)
          </Label>
          <Textarea
            id={`${type}-instructions`}
            value={instructions}
            onChange={(e) => onInstructionsChange?.(e.target.value)}
            placeholder={
              type === 'pickup'
                ? "e.g., Terminal 1 arrival gate, Room 201, Meet at the lobby"
                : "e.g., Main entrance, Specific gate number"
            }
            rows={3}
            className="mt-1"
          />
        </div>
      )}

      {/* Location Categories Legend (for first time users) */}
      {!value && (
        <Card className="bg-zinc-800/50 border-zinc-600">
          <CardContent className="p-4">
            <h4 className="font-medium mb-3 text-sm">Location Categories</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span>✈️</span>
                <span>Airport</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🏘️</span>
                <span>Towns</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🏖️</span>
                <span>Beaches</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🏨</span>
                <span>Hotels</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}