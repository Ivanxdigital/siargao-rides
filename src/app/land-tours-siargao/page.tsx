import type { Metadata } from "next";

import { ServicePageTemplate } from "@/components/service-pages/service-page-template";
import { absoluteUrl } from "@/lib/seo";

const pagePath = "/land-tours-siargao";

export const metadata: Metadata = {
  title: "Land Tours Siargao | 8-Hour Private Van Hire with Driver",
  description:
    "Book land tours in Siargao with an 8-hour private van and driver. Flexible itinerary, clear pricing, and comfortable transport for groups and families.",
  keywords: [
    "land tours siargao",
    "8 hour van hire siargao",
    "private land tour siargao",
  ],
  alternates: {
    canonical: pagePath,
  },
  openGraph: {
    title: "Land Tours Siargao | 8-Hour Private Van Hire with Driver",
    description:
      "Private day-hire van service in Siargao for custom island routes with local driver support.",
    url: absoluteUrl(pagePath),
    type: "website",
    images: [
      {
        url: absoluteUrl("/happy-passengers.jpg"),
        width: 1200,
        height: 630,
        alt: "Private land tours in Siargao",
      },
    ],
  },
};

export default function LandToursPage() {
  return (
    <ServicePageTemplate
      path={pagePath}
      heroBadge="8-hour private day hire"
      title="Land Tours in Siargao with a Private Van"
      description="Enjoy flexible island plans with a private van and local driver for up to 8 hours, built for comfort-first travel and smooth timing."
      proofPoints={[
        "8-hour dedicated van service",
        "Flexible day itinerary",
        "Fuel included for standard routes",
      ]}
      serviceName="Land Tours Siargao by Private Van"
      serviceDescription="Private 8-hour van hire in Siargao for land tours, day trips, and custom multi-stop island routes with local driver support."
      startingPrice="From PHP 8,000 / 8 hours"
      startingPriceValue={8000}
      included={[
        "Private van and local driver for 8 hours",
        "Flexible pickup and multi-stop day routing",
        "Fuel included for standard island routes",
        "Comfortable transport for families and groups",
      ]}
      excluded={[
        "Entrance tickets and activity fees",
        "Extended hours beyond 8-hour booking window",
        "Special remote-route surcharges when outside standard scope",
      ]}
      bestFor={[
        "Travelers planning custom Siargao land tours",
        "Groups who want one driver and one vehicle all day",
        "Guests who value convenience over constant ride-hailing",
      ]}
      processSteps={[
        "Share your preferred stops, date, and group size via WhatsApp.",
        "Receive your day-hire quote and route guidance from our team.",
        "Ride with your private driver and adjust your day as needed.",
      ]}
      faqItems={[
        {
          question: "Can we customize our land tour route?",
          answer:
            "Yes. The 8-hour service is designed for flexible route planning based on your preferred stops.",
        },
        {
          question: "Is fuel included in the day-hire rate?",
          answer:
            "Yes, fuel is included for standard island routes. Custom remote routes may adjust pricing.",
        },
        {
          question: "Can we extend beyond 8 hours?",
          answer:
            "Yes, extensions may be possible based on availability and are billed as an additional charge.",
        },
      ]}
      relatedLinks={[
        {
          href: "/private-van-hire-siargao",
          title: "Private Van Hire Siargao",
          description:
            "Premium private transport for airport rides and island movement.",
        },
        {
          href: "/airport-transfer-siargao",
          title: "Airport Transfer Siargao",
          description:
            "Door-to-door private transfer between IAO Airport and your accommodation.",
        },
        {
          href: "/",
          title: "Main Landing Page",
          description:
            "View core services, pricing overview, and quick WhatsApp booking flow.",
        },
      ]}
      whatsappMessage="Hi Siargao Rides, I'd like a quote for an 8-hour private van land tour in Siargao."
    />
  );
}
