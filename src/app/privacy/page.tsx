import { Metadata } from "next"
import PrivacyClient from "./privacy-client"

// Export metadata for the Privacy page
export const metadata: Metadata = {
  title: "Privacy Policy - Siargao Rides Vehicle Rental Platform",
  description: "Read the Privacy Policy for Siargao Rides. Learn how we protect your personal information when using our motorbike and car rental platform in Siargao Island, Philippines.",
  keywords: [
    "Siargao Rides privacy policy",
    "vehicle rental privacy",
    "data protection Philippines",
    "rental platform privacy",
    "personal information security",
    "privacy rights Siargao",
    "user data protection",
    "booking privacy policy"
  ],
  openGraph: {
    title: "Privacy Policy - Siargao Rides Vehicle Rental Platform", 
    description: "Read the Privacy Policy for Siargao Rides vehicle rental platform in Siargao Island, Philippines.",
    type: "website",
    images: [
      {
        url: "/images/siargao-rides-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Privacy Policy - Siargao Rides",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy - Siargao Rides Vehicle Rental Platform",
    description: "Read the Privacy Policy for Siargao Rides vehicle rental platform in Siargao Island, Philippines.",
    images: ["/images/siargao-rides-og-image.jpg"],
  },
  alternates: {
    canonical: "https://siargaorides.ph/privacy",
  },
}

export default function PrivacyPolicyPage() {
  return <PrivacyClient />
}