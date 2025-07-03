import { Metadata } from "next"
import TermsClient from "./terms-client"

// Export metadata for the Terms page
export const metadata: Metadata = {
  title: "Terms of Service - Siargao Rides Vehicle Rental Platform",
  description: "Read the Terms of Service for Siargao Rides vehicle rental platform. Understand your rights and responsibilities when using our motorbike and car rental directory in Siargao Island, Philippines.",
  keywords: [
    "Siargao Rides terms of service",
    "vehicle rental terms",
    "motorbike rental agreement",
    "rental platform terms",
    "Siargao rental policy",
    "legal terms Philippines",
    "vehicle booking terms",
    "motorcycle rental conditions"
  ],
  openGraph: {
    title: "Terms of Service - Siargao Rides Vehicle Rental Platform",
    description: "Read the Terms of Service for Siargao Rides vehicle rental platform in Siargao Island, Philippines.",
    type: "website",
    images: [
      {
        url: "/images/siargao-rides-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Terms of Service - Siargao Rides",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service - Siargao Rides Vehicle Rental Platform",
    description: "Read the Terms of Service for Siargao Rides vehicle rental platform in Siargao Island, Philippines.",
    images: ["/images/siargao-rides-og-image.jpg"],
  },
  alternates: {
    canonical: "https://siargaorides.ph/terms",
  },
}

export default function TermsOfServicePage() {
  return <TermsClient />
}