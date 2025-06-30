import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

interface DuplicateGroup {
  shop_id: string;
  shop_name: string;
  vehicle_name: string;
  vehicle_type_id: string;
  category_id: string;
  count: number;
  vehicle_ids: string[];
  price_per_day: number;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Get the current authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Failed to get user information' },
        { status: 500 }
      );
    }
    
    // Get shop_id from query params or find all for user
    const url = new URL(request.url);
    const shopId = url.searchParams.get('shop_id');
    
    let shopIds: string[] = [];
    
    if (userData.role === 'admin' && !shopId) {
      // Admin can see all shops
      const { data: allShops } = await supabase
        .from('rental_shops')
        .select('id');
      
      shopIds = allShops?.map(s => s.id) || [];
    } else if (userData.role === 'shop_owner') {
      // Shop owner can only see their shops
      const { data: userShops } = await supabase
        .from('rental_shops')
        .select('id')
        .eq('owner_id', userId);
      
      shopIds = userShops?.map(s => s.id) || [];
      
      // If specific shop requested, verify ownership
      if (shopId && !shopIds.includes(shopId)) {
        return NextResponse.json(
          { error: 'Unauthorized to view this shop' },
          { status: 403 }
        );
      }
      
      if (shopId) {
        shopIds = [shopId];
      }
    } else {
      return NextResponse.json(
        { error: 'Only shop owners and admins can detect duplicate vehicles' },
        { status: 403 }
      );
    }
    
    // Find potential duplicate vehicles
    const { data: duplicates, error: duplicatesError } = await supabase
      .rpc('detect_duplicate_vehicles', {
        p_shop_ids: shopIds
      });
    
    if (duplicatesError) {
      // If function doesn't exist, use manual query
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select(`
          id,
          shop_id,
          name,
          vehicle_type_id,
          category_id,
          price_per_day,
          group_id,
          rental_shops!inner(id, name)
        `)
        .in('shop_id', shopIds)
        .is('group_id', null) // Only ungrouped vehicles
        .order('shop_id')
        .order('name');
      
      if (vehiclesError) {
        console.error('Error fetching vehicles:', vehiclesError);
        return NextResponse.json(
          { error: 'Failed to fetch vehicles' },
          { status: 500 }
        );
      }
      
      // Manually group by shop, name, type, and category
      const groupedVehicles = new Map<string, DuplicateGroup>();
      
      vehicles?.forEach(vehicle => {
        const key = `${vehicle.shop_id}-${vehicle.name}-${vehicle.vehicle_type_id}-${vehicle.category_id}`;
        
        if (!groupedVehicles.has(key)) {
          groupedVehicles.set(key, {
            shop_id: vehicle.shop_id,
            shop_name: vehicle.rental_shops?.name || 'Unknown Shop',
            vehicle_name: vehicle.name,
            vehicle_type_id: vehicle.vehicle_type_id,
            category_id: vehicle.category_id,
            count: 0,
            vehicle_ids: [],
            price_per_day: vehicle.price_per_day
          });
        }
        
        const group = groupedVehicles.get(key)!;
        group.count++;
        group.vehicle_ids.push(vehicle.id);
      });
      
      // Filter to only show groups with more than 1 vehicle
      const potentialGroups = Array.from(groupedVehicles.values())
        .filter(group => group.count > 1)
        .sort((a, b) => b.count - a.count);
      
      return NextResponse.json({
        potential_groups: potentialGroups,
        total_duplicates: potentialGroups.reduce((sum, g) => sum + g.count, 0),
        total_groups: potentialGroups.length
      });
    }
    
    return NextResponse.json({
      potential_groups: duplicates || [],
      total_duplicates: duplicates?.reduce((sum: number, g: any) => sum + g.count, 0) || 0,
      total_groups: duplicates?.length || 0
    });
  } catch (error) {
    console.error('Error in GET /api/vehicle-groups/detect-duplicates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}