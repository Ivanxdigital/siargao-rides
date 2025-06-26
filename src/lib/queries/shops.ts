import { useQuery } from '@tanstack/react-query'
import { BrowseShopsFilters, ShopsPaginationResponse } from '@/lib/types'

export function useBrowseShops(filters: BrowseShopsFilters) {
  return useQuery<ShopsPaginationResponse>({
    queryKey: ['browse-shops', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      
      // Add filters to params
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.sort_by) params.append('sort_by', filters.sort_by)
      if (filters.location) params.append('location', filters.location)
      if (filters.vehicle_types) {
        filters.vehicle_types.forEach(vt => params.append('vehicle_types', vt))
      }
      if (filters.verified_only) params.append('verified_only', 'true')
      if (filters.offers_delivery) params.append('offers_delivery', 'true')
      if (filters.has_whatsapp) params.append('has_whatsapp', 'true')
      if (filters.min_rating) params.append('min_rating', filters.min_rating.toString())
      if (filters.search) params.append('search', filters.search)
      
      const response = await fetch(`/api/shops/browse?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch shops')
      }
      
      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}