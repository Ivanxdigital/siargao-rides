import { Metadata } from "next"
import ContactClient from "./contact-client"

// Export metadata for the Contact page
export const metadata: Metadata = {
  title: "Contact Siargao Rides - Get Help with Vehicle Rentals",
  description: "Contact Siargao Rides for support with vehicle rentals in Siargao Island, Philippines. Get help with bookings, shop inquiries, and customer service. Located in General Luna, Siargao.",
  keywords: [
    "contact Siargao Rides",
    "vehicle rental support",
    "Siargao customer service", 
    "motorbike rental help",
    "General Luna contact",
    "Siargao booking support",
    "rental assistance Philippines",
    "travel help Siargao"
  ],
  openGraph: {
    title: "Contact Siargao Rides - Get Help with Vehicle Rentals",
    description: "Contact Siargao Rides for support with vehicle rentals in Siargao Island, Philippines.",
    type: "website",
    images: [
      {
        url: "/images/siargao-rides-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Contact Siargao Rides - Customer Support",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Siargao Rides - Get Help with Vehicle Rentals",
    description: "Contact Siargao Rides for support with vehicle rentals in Siargao Island, Philippines.",
    images: ["/images/siargao-rides-og-image.jpg"],
  },
  alternates: {
    canonical: "https://siargaorides.ph/contact",
  },
}

export default function ContactPage() {
  return <ContactClient />
}