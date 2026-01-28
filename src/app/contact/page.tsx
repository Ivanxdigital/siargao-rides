import { Metadata } from "next"
import ContactClient from "./contact-client"

// Export metadata for the Contact page
export const metadata: Metadata = {
  title: "Contact Siargao Rides | Private Van Hire & Private Tours | WhatsApp Booking",
  description: "Contact Siargao Rides for private van hire and private tours in Siargao. WhatsApp-first booking for fast quotes and confirmations.",
  keywords: [
    "contact Siargao Rides",
    "private van hire Siargao",
    "private tours Siargao",
    "airport transfer Siargao",
    "General Luna contact",
    "WhatsApp booking Siargao",
    "Siargao transport service",
    "Siargao tour booking"
  ],
  openGraph: {
    title: "Contact Siargao Rides | WhatsApp Booking",
    description: "WhatsApp-first booking for private van hire and private tours in Siargao.",
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
    title: "Contact Siargao Rides | WhatsApp Booking",
    description: "WhatsApp-first booking for private van hire and private tours in Siargao.",
    images: ["/images/siargao-rides-og-image.jpg"],
  },
  alternates: {
    canonical: "https://siargaorides.ph/contact",
  },
}

export default function ContactPage() {
  return <ContactClient />
}
