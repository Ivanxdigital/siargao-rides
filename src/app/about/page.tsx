import { Metadata } from "next"
import AboutClient from "./about-client"

// Export metadata for the About page
export const metadata: Metadata = {
  title: "About Siargao Rides - Your Trusted Vehicle Rental Platform",
  description: "Learn about Siargao Rides, the leading motorbike and car rental platform in Siargao Island, Philippines. Our story, mission, and commitment to connecting travelers with quality local rental shops.",
  keywords: [
    "about Siargao Rides",
    "vehicle rental platform Philippines",
    "Siargao motorbike rental company",
    "local business directory Siargao",
    "travel platform Philippines",
    "motorcycle rental service",
    "Siargao tourism",
    "local rental shops"
  ],
  openGraph: {
    title: "About Siargao Rides - Your Trusted Vehicle Rental Platform",
    description: "Learn about Siargao Rides, the leading motorbike and car rental platform in Siargao Island, Philippines.",
    type: "website",
    images: [
      {
        url: "/images/siargao-rides-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "About Siargao Rides - Vehicle Rental Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Siargao Rides - Your Trusted Vehicle Rental Platform",
    description: "Learn about Siargao Rides, the leading motorbike and car rental platform in Siargao Island, Philippines.",
    images: ["/images/siargao-rides-og-image.jpg"],
  },
  alternates: {
    canonical: "https://siargaorides.ph/about",
  },
}

export default function AboutPage() {
  return <AboutClient />
}