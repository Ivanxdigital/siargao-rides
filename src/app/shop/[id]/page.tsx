"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useParams } from "next/navigation"
import { Star, MapPin, Phone, Mail, MessageCircle } from "lucide-react"
import BikeCard from "@/components/BikeCard"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import * as service from "@/lib/service"
import { Bike, RentalShop, Review } from "@/lib/types"

export default function ShopPage() {
  const { id } = useParams()
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null)
  const [shop, setShop] = useState<RentalShop | null>(null)
  const [bikes, setBikes] = useState<Bike[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchShopData() {
      if (!id || typeof id !== 'string') {
        setError('Invalid shop ID')
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        
        // Get shop data
        const shopData = await service.getShopById(id)
        if (!shopData) {
          setError('Shop not found')
          setLoading(false)
          return
        }
        
        setShop(shopData)
        
        // Get bikes for this shop
        const shopBikes = await service.getBikes({ shop_id: id })
        setBikes(shopBikes)
        
        // Get reviews for this shop
        const shopReviews = await service.getShopReviews(id)
        setReviews(shopReviews)
        
        setLoading(false)
      } catch (err) {
        console.error('Error fetching shop data:', err)
        setError('Failed to load shop data')
        setLoading(false)
      }
    }
    
    fetchShopData()
  }, [id])
  
  const handleBookClick = (bikeId: string) => {
    setSelectedBikeId(bikeId)
    // In a real app, we would show a modal or navigate to a booking page
    console.log(`Book bike ${bikeId} from shop ${id}`)
  }

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold mb-4">Loading Shop Details</h1>
        <p className="text-muted-foreground">
          Please wait while we fetch the shop information...
        </p>
      </div>
    )
  }
  
  // Error state
  if (error || !shop) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold mb-4">Shop Not Found</h1>
        <p className="text-muted-foreground">
          {error || "The shop you're looking for doesn't exist or has been removed."}
        </p>
      </div>
    )
  }
  
  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0

  return (
    <div className="flex flex-col min-h-screen">
      {/* Banner */}
      <div className="relative h-48 md:h-64 w-full">
        <Image
          src={shop.banner_url || 'https://placehold.co/1200x400/1e3b8a/white?text=Shop+Banner'}
          alt={`${shop.name} banner`}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
      </div>
      
      {/* Shop Info */}
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Profile Image */}
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background relative">
            <Image
              src={shop.logo_url || 'https://placehold.co/400x400/1e3b8a/white?text=Logo'}
              alt={shop.name}
              fill
              className="object-cover"
            />
          </div>
          
          {/* Shop Details */}
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold">{shop.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center">
                <Star size={18} className="text-tropical-yellow fill-tropical-yellow" />
                <span className="ml-1 font-medium">{averageRating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
              {shop.is_verified && <Badge variant="verified" className="ml-2">Verified Shop</Badge>}
            </div>
            <p className="text-muted-foreground mt-4">{shop.description || "No description available."}</p>
          </div>
          
          {/* Contact Info */}
          <div className="bg-card border border-border rounded-lg p-4 w-full md:w-auto md:min-w-64">
            <h3 className="font-semibold mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin size={18} />
                <span className="text-sm">{shop.address}, {shop.city}</span>
              </div>
              {shop.phone_number && (
                <div className="flex items-center gap-2">
                  <Phone size={18} />
                  <a href={`tel:${shop.phone_number}`} className="text-sm hover:text-primary transition-colors">
                    {shop.phone_number}
                  </a>
                </div>
              )}
              {shop.email && (
                <div className="flex items-center gap-2">
                  <Mail size={18} />
                  <a href={`mailto:${shop.email}`} className="text-sm hover:text-primary transition-colors">
                    {shop.email}
                  </a>
                </div>
              )}
              {shop.whatsapp && (
                <Button 
                  className="w-full mt-2" 
                  variant="outline"
                  onClick={() => window.open(`https://wa.me/${shop.whatsapp?.replace(/\+/g, '').replace(/\s/g, '')}`, '_blank')}
                >
                  <MessageCircle size={18} className="mr-2" />
                  WhatsApp
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Google Map */}
      {(shop.latitude && shop.longitude) ? (
        <div className="container mx-auto px-4 mt-8">
          <div className="border border-border rounded-lg overflow-hidden h-64">
            <iframe
              title={`${shop.name} location`}
              width="100%"
              height="100%"
              frameBorder="0"
              src={`https://maps.google.com/maps?q=${shop.latitude},${shop.longitude}&z=15&output=embed`}
              allowFullScreen
            ></iframe>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 mt-8">
          <div className="border border-border rounded-lg overflow-hidden h-64 bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">Map location not available</p>
          </div>
        </div>
      )}
      
      {/* Bike Listings */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-6">Available Bikes</h2>
        
        {bikes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No bikes available from this shop at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bikes.map(bike => (
              <BikeCard
                key={bike.id}
                id={bike.id}
                model={bike.name}
                images={bike.images?.map(img => img.image_url) || []}
                prices={{
                  daily: bike.price_per_day,
                  weekly: bike.price_per_week,
                  monthly: bike.price_per_month
                }}
                isAvailable={bike.is_available}
                onBookClick={handleBookClick}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Reviews */}
      <div className="container mx-auto px-4 py-8 border-t border-border">
        <h2 className="text-2xl font-semibold mb-6">Customer Reviews</h2>
        
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No reviews yet. Be the first to review this shop!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map(review => (
              <div key={review.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">User ID: {review.user_id}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        className={i < review.rating ? "text-tropical-yellow fill-tropical-yellow" : "text-muted"} 
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-sm">{review.comment || "No comment provided."}</p>
                
                {/* Reply from shop owner */}
                {review.reply && (
                  <div className="mt-4 pl-4 border-l-2 border-border">
                    <div className="text-sm font-medium">Shop Reply:</div>
                    <p className="mt-1 text-sm">{review.reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 