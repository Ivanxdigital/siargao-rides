"use client"

import { useState } from "react"
import Image from "next/image"
import { useParams } from "next/navigation"
import { Star, MapPin, Phone, Mail, MessageCircle } from "lucide-react"
import BikeCard from "@/components/BikeCard"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"

// Mock data for shops
const SHOPS = {
  "shop1": {
    id: "shop1",
    name: "Island Riders",
    description: "We offer high-quality motorbikes for rent at affordable prices. Our bikes are well-maintained and perfect for exploring Siargao Island.",
    bannerImage: "/placeholder.jpg",
    profileImage: "/placeholder.jpg",
    location: "General Luna, Siargao Island",
    googleMapUrl: "https://maps.google.com/?q=Island+Riders+Siargao",
    contact: {
      phone: "+63 912 345 6789",
      email: "info@islandriders.com",
      whatsapp: "+63 912 345 6789"
    },
    rating: 4.7,
    reviewCount: 24,
    reviews: [
      { id: "r1", user: "John D.", rating: 5, date: "2023-12-10", text: "Great bikes, no issues. Highly recommended!" },
      { id: "r2", user: "Maria S.", rating: 4, date: "2023-11-25", text: "Good service, bikes were in decent condition." }
    ],
    bikes: [
      { 
        id: "bike1", 
        model: "Honda Click 125i", 
        images: ["/placeholder.jpg", "/placeholder.jpg"], 
        prices: { daily: 400, weekly: 2500, monthly: 9000 },
        isAvailable: true 
      },
      { 
        id: "bike2", 
        model: "Yamaha Mio Sporty", 
        images: ["/placeholder.jpg"], 
        prices: { daily: 350, weekly: 2200 },
        isAvailable: true 
      },
      { 
        id: "bike3", 
        model: "Honda XR150", 
        images: ["/placeholder.jpg", "/placeholder.jpg", "/placeholder.jpg"], 
        prices: { daily: 600, weekly: 3800, monthly: 15000 },
        isAvailable: false 
      }
    ]
  },
  "shop2": {
    id: "shop2",
    name: "Siargao Wheels",
    description: "Your trusted motorbike rental partner in Siargao. We provide well-maintained bikes for your island adventures.",
    bannerImage: "/placeholder.jpg",
    profileImage: "/placeholder.jpg",
    location: "Cloud 9, General Luna, Siargao Island",
    googleMapUrl: "https://maps.google.com/?q=Siargao+Wheels",
    contact: {
      phone: "+63 943 876 5432",
      email: "rentals@siargaowheels.com",
      whatsapp: "+63 943 876 5432"
    },
    rating: 4.5,
    reviewCount: 18,
    reviews: [
      { id: "r1", user: "Alex T.", rating: 5, date: "2023-12-05", text: "Great service and bikes in good condition." },
      { id: "r2", user: "Sophia L.", rating: 4, date: "2023-11-20", text: "Decent rental experience, friendly staff." }
    ],
    bikes: [
      { 
        id: "bike1", 
        model: "Yamaha Nmax", 
        images: ["/placeholder.jpg"], 
        prices: { daily: 500, weekly: 3200, monthly: 12000 },
        isAvailable: true 
      },
      { 
        id: "bike2", 
        model: "Honda ADV150", 
        images: ["/placeholder.jpg", "/placeholder.jpg"], 
        prices: { daily: 550, weekly: 3500 },
        isAvailable: false 
      }
    ]
  }
}

export default function ShopPage() {
  const { id } = useParams()
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null)
  
  // Get shop data
  const shop = SHOPS[id as keyof typeof SHOPS]
  
  // If shop doesn't exist, show error
  if (!shop) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold mb-4">Shop Not Found</h1>
        <p className="text-muted-foreground">
          The shop you're looking for doesn't exist or has been removed.
        </p>
      </div>
    )
  }
  
  const handleBookClick = (bikeId: string) => {
    setSelectedBikeId(bikeId)
    // In a real app, we would show a modal or navigate to a booking page
    console.log(`Book bike ${bikeId} from shop ${shop.id}`)
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Banner */}
      <div className="relative h-48 md:h-64 w-full">
        <Image
          src={shop.bannerImage}
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
              src={shop.profileImage}
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
                <span className="ml-1 font-medium">{shop.rating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-muted-foreground">({shop.reviewCount} reviews)</span>
              <Badge variant="verified" className="ml-2">Verified Shop</Badge>
            </div>
            <p className="text-muted-foreground mt-4">{shop.description}</p>
          </div>
          
          {/* Contact Info */}
          <div className="bg-card border border-border rounded-lg p-4 w-full md:w-auto md:min-w-64">
            <h3 className="font-semibold mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin size={18} />
                <span className="text-sm">{shop.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={18} />
                <a href={`tel:${shop.contact.phone}`} className="text-sm hover:text-primary transition-colors">
                  {shop.contact.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={18} />
                <a href={`mailto:${shop.contact.email}`} className="text-sm hover:text-primary transition-colors">
                  {shop.contact.email}
                </a>
              </div>
              <Button className="w-full mt-2" variant="outline">
                <MessageCircle size={18} className="mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Google Map */}
      <div className="container mx-auto px-4 mt-8">
        <div className="border border-border rounded-lg overflow-hidden h-64 bg-muted flex items-center justify-center">
          <p className="text-muted-foreground">Google Map Embed would appear here</p>
        </div>
      </div>
      
      {/* Bike Listings */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-6">Available Bikes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shop.bikes.map(bike => (
            <BikeCard
              key={bike.id}
              id={bike.id}
              model={bike.model}
              images={bike.images}
              prices={bike.prices}
              isAvailable={bike.isAvailable}
              onBookClick={handleBookClick}
            />
          ))}
        </div>
      </div>
      
      {/* Reviews */}
      <div className="container mx-auto px-4 py-8 border-t border-border">
        <h2 className="text-2xl font-semibold mb-6">Customer Reviews</h2>
        <div className="space-y-6">
          {shop.reviews.map(review => (
            <div key={review.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{review.user}</div>
                  <div className="text-sm text-muted-foreground">{review.date}</div>
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
              <p className="mt-3 text-sm">{review.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 