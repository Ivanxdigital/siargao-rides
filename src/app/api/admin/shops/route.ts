import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/admin';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!session || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (user.user_metadata?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all'; // all, active, inactive, verified, unverified, showcase
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Calculate offset
    const offset = (page - 1) * limit;

    // Base query
    let query = supabaseAdmin
      .from('rental_shops')
      .select(`
        *,
        owner:users!rental_shops_owner_id_fkey (
          id,
          email,
          first_name,
          last_name,
          phone_number,
          avatar_url
        )
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,address.ilike.%${search}%`);
    }

    // Apply status filters
    switch (status) {
      case 'active':
        query = query.eq('is_active', true);
        break;
      case 'inactive':
        query = query.eq('is_active', false);
        break;
      case 'verified':
        query = query.eq('is_verified', true);
        break;
      case 'unverified':
        query = query.eq('is_verified', false);
        break;
      case 'showcase':
        query = query.eq('is_showcase', true);
        break;
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: shops, error, count } = await query;

    if (error) {
      console.error('Error fetching shops:', error);
      return NextResponse.json(
        { error: 'Failed to fetch shops', details: error.message },
        { status: 500 }
      );
    }

    // Get additional statistics for each shop
    const shopsWithStats = await Promise.all(
      (shops || []).map(async (shop) => {
        // Get vehicle count
        const { count: vehicleCount } = await supabaseAdmin
          .from('vehicles')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shop.id);

        // Get active rentals count
        const { count: activeRentalsCount } = await supabaseAdmin
          .from('rentals')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shop.id)
          .in('status', ['pending', 'confirmed']);

        // Get total rentals count
        const { count: totalRentalsCount } = await supabaseAdmin
          .from('rentals')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shop.id);

        // Get average rating
        const { data: reviewStats } = await supabaseAdmin
          .from('reviews')
          .select('rating')
          .eq('shop_id', shop.id);

        const avgRating = reviewStats && reviewStats.length > 0
          ? reviewStats.reduce((sum, r) => sum + r.rating, 0) / reviewStats.length
          : 0;

        return {
          ...shop,
          stats: {
            vehicleCount: vehicleCount || 0,
            activeRentalsCount: activeRentalsCount || 0,
            totalRentalsCount: totalRentalsCount || 0,
            averageRating: avgRating,
            reviewCount: reviewStats?.length || 0
          }
        };
      })
    );

    // Calculate total pages
    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      shops: shopsWithStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error in GET /api/admin/shops:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}