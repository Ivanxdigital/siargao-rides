import { Metadata } from "next"
import SiargaoVanHireClient from "@/components/van-hire/SiargaoVanHireClient"

export const metadata: Metadata = {
  title: "Private Van Hire Siargao – Airport Transfers | Siargao Rides",
  description: "Book an air-conditioned private van from Sayak Airport to General Luna for a fixed ₱2,500. No sharing, pro drivers, instant confirmation.",
  keywords: ["private van hire Siargao", "Siargao airport transfer", "Sayak airport pickup", "private transport Siargao", "van rental Siargao"],
  openGraph: {
    type: "website",
    title: "Private Van Hire Siargao – Airport Transfers | Siargao Rides",
    description: "Fixed-rate airport pick-ups & island transfers with Siargao Rides.",
    url: "https://siargaorides.ph/siargao-private-van-hire",
    siteName: "Siargao Rides",
  },
  twitter: {
    card: "summary_large_image",
    title: "Private Van Hire Siargao",
    description: "Fixed-rate airport pick-ups & island transfers with Siargao Rides.",
  },
  alternates: {
    canonical: "https://siargaorides.ph/siargao-private-van-hire"
  }
}

export default function SiargaoPrivateVanHirePage() {
  return (
    <>
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Private Van Hire",
            "provider": {
              "@type": "LocalBusiness",
              "name": "Siargao Rides",
              "areaServed": "Siargao",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "Philippines",
                "addressRegion": "Surigao del Norte",
                "addressLocality": "Siargao"
              }
            },
            "areaServed": "Siargao",
            "offers": {
              "@type": "Offer",
              "priceCurrency": "PHP",
              "price": "2500",
              "description": "Fixed rate private van hire service"
            },
            "description": "Private air-conditioned van hire service in Siargao for airport transfers and island tours"
          })
        }}
      />
      
      <SiargaoVanHireClient />
    </>
  )
}