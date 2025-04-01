"use client"

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Bike, RentalShop } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import BookingForm from "@/components/BookingForm";
import BookingSummary from "@/components/BookingSummary";

export default function BookingPage() {
  const { bikeId } = useParams();
  const searchParams = useSearchParams();
  const shopId = searchParams.get("shop");
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [bike, setBike] = useState<Bike | null>(null);
  const [shop, setShop] = useState<RentalShop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add state for dates and delivery fee to share between components
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  
  useEffect(() => {
    // Fetch bike and shop data
    const fetchData = async () => {
      if (!bikeId || !shopId) {
        setError("Missing bike or shop ID");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const supabase = createClientComponentClient();
        
        // Get bike data
        const { data: bikeData, error: bikeError } = await supabase
          .from('bikes')
          .select(`
            *,
            bike_images(*)
          `)
          .eq('id', bikeId)
          .single();
          
        if (bikeError || !bikeData) {
          console.error('Error fetching bike:', bikeError);
          setError('Bike not found');
          setLoading(false);
          return;
        }
        
        // Format bike data
        const formattedBike = {
          ...bikeData,
          images: bikeData.bike_images || []
        };
        
        setBike(formattedBike);
        
        // Get shop data
        const { data: shopData, error: shopError } = await supabase
          .from('rental_shops')
          .select('*')
          .eq('id', shopId)
          .single();
          
        if (shopError || !shopData) {
          console.error('Error fetching shop:', shopError);
          setError('Shop not found');
          setLoading(false);
          return;
        }
        
        setShop(shopData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load booking data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [bikeId, shopId]);

  const goBack = () => {
    router.back();
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={goBack} className="mb-6">
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>
          
          <div className="text-center py-20">
            <h1 className="text-2xl font-semibold mb-4">Loading Booking Details</h1>
            <p className="text-muted-foreground">
              Please wait while we prepare your booking...
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !bike || !shop) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={goBack} className="mb-6">
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>
          
          <div className="text-center py-20">
            <h1 className="text-2xl font-semibold mb-4">Booking Not Available</h1>
            <p className="text-muted-foreground mb-6">
              {error || "The bike or shop you're looking for doesn't exist or has been removed."}
            </p>
            <Button onClick={() => router.push('/browse')}>
              Browse Available Bikes
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // This is just a placeholder. In the next step, we'll create and import the actual BookingForm and BookingSummary components
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={goBack} className="mb-6">
          <ArrowLeft size={18} className="mr-2" />
          Back to Shop
        </Button>
        
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Book {bike.name}</h1>
        <p className="text-white/70 mb-8">from {shop.name}</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Booking Form</h2>
              
              <BookingForm
                bike={bike}
                shop={shop}
                user={user}
                isAuthenticated={isAuthenticated}
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onDeliveryFeeChange={setDeliveryFee}
              />
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Booking Summary</h2>
              
              <BookingSummary
                bike={bike}
                shop={shop}
                startDate={startDate}
                endDate={endDate}
                deliveryFee={deliveryFee}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 