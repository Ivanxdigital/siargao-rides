import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { 
  VehicleGroup, 
  VehicleGroupWithDetails, 
  CreateVehicleGroupRequest,
  Vehicle,
  VehicleGroupAvailability,
  GroupAvailabilityResponse,
  CreateGroupResponse,
  VehicleDocument,
  VehicleImage
} from '@/lib/types';

export class VehicleGroupService {
  private supabase;

  constructor() {
    this.supabase = createServerComponentClient({ cookies });
  }

  /**
   * Creates a new vehicle group with multiple vehicles
   */
  async createGroup(data: CreateVehicleGroupRequest): Promise<CreateGroupResponse> {
    try {
      // Call the database function to create group and vehicles
      const { data: result, error } = await this.supabase
        .rpc('create_vehicle_group_with_vehicles', {
          p_shop_id: data.shop_id,
          p_name: data.name,
          p_vehicle_type_id: data.vehicle_type_id,
          p_category_id: data.category_id,
          p_quantity: data.quantity,
          p_vehicle_data: data.base_vehicle_data,
          p_naming_pattern: data.naming_pattern || 'Unit {index}',
          p_individual_names: data.individual_names || null
        });

      if (error) {
        console.error('Error creating vehicle group:', error);
        return {
          group: null,
          vehicles: [],
          success: false,
          message: error.message
        };
      }

      // Fetch the created group and vehicles
      const { group_id, vehicle_ids } = result[0];

      const [groupData, vehiclesData] = await Promise.all([
        this.getGroupById(group_id),
        this.getVehiclesByIds(vehicle_ids)
      ]);

      // Handle images for all vehicles if provided
      if (data.base_vehicle_data.images && data.base_vehicle_data.images.length > 0) {
        await this.attachImagesToVehicles(vehicle_ids, data.base_vehicle_data.images);
      }

      return {
        group: groupData,
        vehicles: vehiclesData,
        success: true
      };
    } catch (error) {
      console.error('Error in createGroup:', error);
      return {
        group: null,
        vehicles: [],
        success: false,
        message: 'Failed to create vehicle group'
      };
    }
  }

  /**
   * Gets all vehicle groups for a shop
   */
  async getGroupsByShopId(shopId: string): Promise<VehicleGroupWithDetails[]> {
    const { data, error } = await this.supabase
      .from('vehicle_group_availability')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vehicle groups:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Gets a single vehicle group by ID
   */
  async getGroupById(groupId: string): Promise<VehicleGroup | null> {
    const { data, error } = await this.supabase
      .from('vehicle_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error) {
      console.error('Error fetching vehicle group:', error);
      return null;
    }

    return data;
  }

  /**
   * Checks availability for a vehicle group in a date range
   */
  async getGroupAvailability(
    groupId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<GroupAvailabilityResponse | null> {
    const { data, error } = await this.supabase
      .rpc('check_group_availability', {
        p_group_id: groupId,
        p_start_date: startDate.toISOString().split('T')[0],
        p_end_date: endDate.toISOString().split('T')[0]
      });

    if (error) {
      console.error('Error checking group availability:', error);
      return null;
    }

    const result = data[0];
    
    // Fetch vehicle details for available vehicles
    const vehicleDetails = await this.getVehiclesByIds(result.available_vehicles || []);
    
    return {
      group_id: groupId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      total_vehicles: result.total_count,
      available_count: result.available_count,
      available_vehicles: vehicleDetails.map(v => ({
        id: v.id,
        identifier: v.individual_identifier || `${v.name} #${v.group_index}`,
        next_available_date: undefined // Could be calculated if needed
      }))
    };
  }

  /**
   * Assigns an available vehicle from a group for a rental
   */
  async assignVehicleFromGroup(
    groupId: string,
    startDate: Date,
    endDate: Date,
    strategy: 'sequential' | 'random' | 'least_used' = 'sequential'
  ): Promise<string | null> {
    const { data, error } = await this.supabase
      .rpc('assign_vehicle_from_group', {
        p_group_id: groupId,
        p_start_date: startDate.toISOString().split('T')[0],
        p_end_date: endDate.toISOString().split('T')[0],
        p_strategy: strategy
      });

    if (error) {
      console.error('Error assigning vehicle from group:', error);
      return null;
    }

    return data;
  }

  /**
   * Updates all vehicles in a group with new data
   */
  async bulkUpdateGroup(
    groupId: string,
    updates: Partial<{
      price_per_day: number;
      price_per_week: number;
      price_per_month: number;
      description: string;
      specifications: any;
      is_available: boolean;
    }>
  ): Promise<boolean> {
    // Get group settings to check what should be shared
    const { data: settings, error: settingsError } = await this.supabase
      .from('vehicle_group_settings')
      .select('*')
      .eq('group_id', groupId)
      .single();

    if (settingsError) {
      console.error('Error fetching group settings:', settingsError);
      return false;
    }

    // Filter updates based on group settings
    const filteredUpdates: any = {};
    
    if (settings.share_pricing && (updates.price_per_day || updates.price_per_week || updates.price_per_month)) {
      if (updates.price_per_day) filteredUpdates.price_per_day = updates.price_per_day;
      if (updates.price_per_week) filteredUpdates.price_per_week = updates.price_per_week;
      if (updates.price_per_month) filteredUpdates.price_per_month = updates.price_per_month;
    }
    
    if (settings.share_specifications && updates.specifications) {
      filteredUpdates.specifications = updates.specifications;
    }
    
    // Description and availability are always shared
    if (updates.description !== undefined) filteredUpdates.description = updates.description;
    if (updates.is_available !== undefined) filteredUpdates.is_available = updates.is_available;

    // Update all vehicles in the group
    const { error } = await this.supabase
      .from('vehicles')
      .update(filteredUpdates)
      .eq('group_id', groupId);

    if (error) {
      console.error('Error updating vehicles in group:', error);
      return false;
    }

    return true;
  }

  /**
   * Updates group settings
   */
  async updateGroupSettings(
    groupId: string,
    settings: Partial<{
      auto_assign_strategy: 'sequential' | 'random' | 'least_used';
      naming_pattern: string;
      share_images: boolean;
      share_pricing: boolean;
      share_specifications: boolean;
    }>
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('vehicle_group_settings')
      .update(settings)
      .eq('group_id', groupId);

    if (error) {
      console.error('Error updating group settings:', error);
      return false;
    }

    return true;
  }

  /**
   * Converts existing individual vehicles into a group
   */
  async convertToGroup(
    vehicleIds: string[],
    groupName: string
  ): Promise<CreateGroupResponse> {
    try {
      // Get the first vehicle as the template
      const { data: vehicles, error: vehiclesError } = await this.supabase
        .from('vehicles')
        .select('*')
        .in('id', vehicleIds);

      if (vehiclesError || !vehicles || vehicles.length === 0) {
        return {
          group: null,
          vehicles: [],
          success: false,
          message: 'Failed to fetch vehicles'
        };
      }

      const templateVehicle = vehicles[0];

      // Create the group
      const { data: group, error: groupError } = await this.supabase
        .from('vehicle_groups')
        .insert({
          shop_id: templateVehicle.shop_id,
          name: groupName,
          base_vehicle_id: templateVehicle.id,
          vehicle_type_id: templateVehicle.vehicle_type_id,
          category_id: templateVehicle.category_id,
          total_quantity: vehicles.length
        })
        .select()
        .single();

      if (groupError) {
        return {
          group: null,
          vehicles: [],
          success: false,
          message: groupError.message
        };
      }

      // Create group settings
      await this.supabase
        .from('vehicle_group_settings')
        .insert({
          group_id: group.id
        });

      // Update vehicles to belong to the group
      const updatePromises = vehicles.map((vehicle, index) => 
        this.supabase
          .from('vehicles')
          .update({
            group_id: group.id,
            group_index: index + 1,
            individual_identifier: `Unit ${index + 1}`,
            is_group_primary: index === 0
          })
          .eq('id', vehicle.id)
      );

      await Promise.all(updatePromises);

      return {
        group,
        vehicles,
        success: true
      };
    } catch (error) {
      console.error('Error converting to group:', error);
      return {
        group: null,
        vehicles: [],
        success: false,
        message: 'Failed to convert vehicles to group'
      };
    }
  }

  /**
   * Removes a vehicle from a group (ungroups it)
   */
  async removeFromGroup(vehicleId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('vehicles')
      .update({
        group_id: null,
        group_index: null,
        individual_identifier: null,
        is_group_primary: false
      })
      .eq('id', vehicleId);

    if (error) {
      console.error('Error removing vehicle from group:', error);
      return false;
    }

    // Update the group's total quantity
    const { data: vehicle } = await this.supabase
      .from('vehicles')
      .select('group_id')
      .eq('id', vehicleId)
      .single();

    if (vehicle?.group_id) {
      const { data: remainingVehicles } = await this.supabase
        .from('vehicles')
        .select('id')
        .eq('group_id', vehicle.group_id);

      await this.supabase
        .from('vehicle_groups')
        .update({
          total_quantity: remainingVehicles?.length || 0
        })
        .eq('id', vehicle.group_id);
    }

    return true;
  }

  /**
   * Helper method to get vehicles by IDs
   */
  private async getVehiclesByIds(vehicleIds: string[]): Promise<Vehicle[]> {
    if (vehicleIds.length === 0) return [];

    const { data, error } = await this.supabase
      .from('vehicles')
      .select('*')
      .in('id', vehicleIds)
      .order('group_index');

    if (error) {
      console.error('Error fetching vehicles:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Helper method to attach images to vehicles
   */
  private async attachImagesToVehicles(vehicleIds: string[], images: VehicleImage[]): Promise<void> {
    const imageInserts = vehicleIds.flatMap(vehicleId => 
      images.map(image => ({
        vehicle_id: vehicleId,
        image_url: image.image_url,
        is_primary: image.is_primary
      }))
    );

    const { error } = await this.supabase
      .from('vehicle_images')
      .insert(imageInserts);

    if (error) {
      console.error('Error attaching images to vehicles:', error);
    }
  }
}