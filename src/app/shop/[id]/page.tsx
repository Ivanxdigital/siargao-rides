import { Metadata } from "next";
import * as service from "@/lib/service"
import ShopPageClient from "./ShopPageClient"
import { notFound } from "next/navigation"

// Generate metadata for individual shop pages
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const shop = await service.getShopByIdOrUsername(params.id);
    
    if (!shop) {
      return {
        title: 'Shop Not Found | Siargao Rides',
        description: 'The shop you are looking for could not be found on Siargao Rides.',
      };
    }

    // Calculate vehicle count for description
    const vehicles = await service.getVehicles({ shop_id: shop.id });
    const vehicleCount = vehicles?.length || 0;

    const title = `${shop.name} - Vehicle Rental Shop in ${shop.city} | Siargao Rides`;
    const description = `Rent motorbikes and vehicles from ${shop.name} in ${shop.city}, Siargao. ${shop.is_verified ? 'Verified shop' : 'Local shop'} with ${vehicleCount > 0 ? `${vehicleCount} vehicles available` : 'quality vehicles'}, competitive rates, and excellent service.`;

    return {
      title,
      description,
      keywords: [
        shop.name,
        `vehicle rental ${shop.city}`,
        `motorbike rental Siargao`,
        `${shop.city} bike rental`,
        `car rental ${shop.city}`,
        `Siargao vehicle rental`,
        `${shop.city} transportation`,
        shop.is_verified ? 'verified rental shop' : 'local rental shop'
      ],
      openGraph: {
        title: `${shop.name} - Vehicle Rentals in ${shop.city}`,
        description,
        type: 'website',
        images: [
          {
            url: shop.banner_url || shop.logo_url || '/images/siargao-rides-og-image.jpg',
            width: 1200,
            height: 630,
            alt: `${shop.name} - Vehicle Rental Shop in ${shop.city}, Siargao`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [shop.banner_url || shop.logo_url || '/images/siargao-rides-og-image.jpg'],
      },
      alternates: {
        canonical: `https://siargaorides.ph/shop/${params.id}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata for shop page:', error);
    return {
      title: 'Shop | Siargao Rides',
      description: 'Rent motorbikes and vehicles in Siargao Island, Philippines.',
    };
  }
}

// Server component that fetches initial data and renders the client component
export default async function ShopPage({ params }: { params: { id: string } }) {
  try {
    const shop = await service.getShopByIdOrUsername(params.id);
    
    if (!shop) {
      notFound();
    }

    return <ShopPageClient initialShop={shop} shopId={params.id} />;
  } catch (error) {
    console.error('Error loading shop:', error);
    notFound();
  }
}