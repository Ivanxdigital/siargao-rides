import { Vehicle } from '@/lib/types';

export interface GroupedVehicle {
  groupKey: string;
  groupId?: string;
  vehicles: Vehicle[];
  representativeVehicle: Vehicle;
  totalCount: number;
  availableCount: number;
  priceRange: {
    min: number;
    max: number;
  };
  isGroup: boolean;
}

/**
 * Groups vehicles by their group_id or by similarity for display purposes
 * @param vehicles Array of vehicles to group
 * @returns Array of grouped vehicles ready for display
 */
export function groupVehiclesForDisplay(vehicles: Vehicle[]): GroupedVehicle[] {
  const groupedMap = new Map<string, Vehicle[]>();
  
  vehicles.forEach(vehicle => {
    let groupKey: string;
    
    // Primary grouping: Use existing group_id if available
    if (vehicle.group_id) {
      groupKey = `group_${vehicle.group_id}`;
    } else {
      // Secondary grouping: Group by name + vehicle_type + category for similar vehicles
      groupKey = `${vehicle.name}_${vehicle.vehicle_type}_${vehicle.category}`.toLowerCase();
    }
    
    if (!groupedMap.has(groupKey)) {
      groupedMap.set(groupKey, []);
    }
    groupedMap.get(groupKey)!.push(vehicle);
  });
  
  const groupedVehicles: GroupedVehicle[] = [];
  
  groupedMap.forEach((vehicleGroup, groupKey) => {
    // Sort vehicles in group by group_index if available, otherwise by name
    vehicleGroup.sort((a, b) => {
      if (a.group_index && b.group_index) {
        return a.group_index - b.group_index;
      }
      return a.name.localeCompare(b.name);
    });
    
    // Use the primary vehicle (is_group_primary) or first vehicle as representative
    const representativeVehicle = vehicleGroup.find(v => v.is_group_primary) || vehicleGroup[0];
    
    const availableVehicles = vehicleGroup.filter(v => v.is_available);
    const prices = vehicleGroup.map(v => v.price_per_day);
    
    const groupedVehicle: GroupedVehicle = {
      groupKey,
      groupId: vehicleGroup[0].group_id,
      vehicles: vehicleGroup,
      representativeVehicle,
      totalCount: vehicleGroup.length,
      availableCount: availableVehicles.length,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices)
      },
      isGroup: vehicleGroup.length > 1
    };
    
    groupedVehicles.push(groupedVehicle);
  });
  
  return groupedVehicles;
}

/**
 * Determines if vehicles should be grouped based on similarity
 * @param vehicle1 First vehicle to compare
 * @param vehicle2 Second vehicle to compare
 * @returns true if vehicles are similar enough to be grouped
 */
export function shouldGroupVehicles(vehicle1: Vehicle, vehicle2: Vehicle): boolean {
  // Same group_id is always grouped
  if (vehicle1.group_id && vehicle2.group_id && vehicle1.group_id === vehicle2.group_id) {
    return true;
  }
  
  // Group by similarity: same name, type, and category
  if (
    vehicle1.name === vehicle2.name &&
    vehicle1.vehicle_type === vehicle2.vehicle_type &&
    vehicle1.category === vehicle2.category
  ) {
    // Additional check: prices should be within reasonable range (±20%)
    const priceDifference = Math.abs(vehicle1.price_per_day - vehicle2.price_per_day);
    const averagePrice = (vehicle1.price_per_day + vehicle2.price_per_day) / 2;
    const priceVariationPercent = (priceDifference / averagePrice) * 100;
    
    return priceVariationPercent <= 20; // Allow up to 20% price variation
  }
  
  return false;
}

/**
 * Gets the display name for a grouped vehicle
 * @param groupedVehicle The grouped vehicle data
 * @returns Formatted display name with availability info
 */
export function getGroupedVehicleDisplayName(groupedVehicle: GroupedVehicle): string {
  const baseName = groupedVehicle.representativeVehicle.name;
  
  if (!groupedVehicle.isGroup) {
    return baseName;
  }
  
  return `${baseName} (${groupedVehicle.availableCount} available)`;
}

/**
 * Gets price display text for grouped vehicles
 * @param groupedVehicle The grouped vehicle data
 * @returns Formatted price text
 */
export function getGroupedVehiclePriceDisplay(groupedVehicle: GroupedVehicle): string {
  const { min, max } = groupedVehicle.priceRange;
  
  if (min === max) {
    return `₱${min}/day`;
  }
  
  return `₱${min} - ₱${max}/day`;
}