import type { Metadata } from "next";

import { ServicePageTemplate } from "@/components/service-pages/service-page-template";
import { absoluteUrl } from "@/lib/seo";

const pagePath = "/airport-transfer-siargao";

export const metadata: Metadata = {
  title: "Private Van Pick Up Service Siargao | Airport Transfer IAO",
  description:
    "Book a private van airport transfer in Siargao. Direct pickup from IAO Airport to your hotel with local drivers, luggage space, and clear rates.",
  keywords: [
    "private van pick up service siargao",
    "siargao airport transfer",
    "iao airport transfer",
  ],
  alternates: {
    canonical: pagePath,
  },
  openGraph: {
    title: "Private Van Pick Up Service Siargao | Airport Transfer IAO",
    description:
      "Reliable private airport transfer service from IAO Airport to General Luna and nearby areas.",
    url: absoluteUrl(pagePath),
    type: "website",
    images: [
      {
        url: absoluteUrl("/daku-island.webp"),
        width: 1200,
        height: 630,
        alt: "Private airport transfer in Siargao",
      },
    ],
  },
};

export default function AirportTransferPage() {
  return (
    <ServicePageTemplate
      path={pagePath}
      heroBadge="IAO airport private pickup"
      title="Private Van Pick Up Service in Siargao"
      description="Door-to-door airport transfer with professional local drivers, fast response times, and direct routing to your accommodation."
      proofPoints={[
        "IAO airport pickup and drop-off",
        "Flight delay coordination",
        "No shared van waiting",
      ]}
      serviceName="Private Van Airport Transfer Siargao"
      serviceDescription="Private airport transfer service in Siargao between Sayak Airport (IAO) and accommodations around General Luna and nearby areas."
      startingPrice="From PHP 3,500 one way"
      startingPriceValue={3500}
      included={[
        "Private airport transfer for your group only",
        "Direct transfer between IAO Airport and your accommodation",
        "Driver coordination based on your arrival or departure details",
        "Space for luggage and surfboards",
      ]}
      excluded={[
        "Extra waiting caused by major itinerary changes not shared in advance",
        "Multi-stop custom routes (available by custom quote)",
        "Fees unrelated to transport service",
      ]}
      bestFor={[
        "Guests arriving with luggage who want a smooth arrival",
        "Families and groups who do not want shared transfers",
        "Travelers with tight schedules and resort check-in plans",
      ]}
      processSteps={[
        "Share your flight, accommodation, and group details on WhatsApp.",
        "Receive your one-way or return airport transfer quote quickly.",
        "Meet your driver and ride directly to your destination.",
      ]}
      faqItems={[
        {
          question: "Do you monitor delayed flights?",
          answer:
            "Yes. Share your flight details and we adjust pickup timing when arrival changes.",
        },
        {
          question: "Can you do both arrival and departure transfers?",
          answer:
            "Yes. We handle one-way and round-trip airport transfer requests.",
        },
        {
          question: "Where do you drop us off?",
          answer:
            "We provide door-to-door drop-off in General Luna and surrounding areas, with custom quotes for remote routes.",
        },
      ]}
      relatedLinks={[
        {
          href: "/private-van-hire-siargao",
          title: "Private Van Hire Siargao",
          description:
            "Dedicated van service for airport transfers and flexible island transport.",
        },
        {
          href: "/land-tours-siargao",
          title: "Land Tours Siargao",
          description:
            "8-hour private day hire for custom tours and relaxed island plans.",
        },
        {
          href: "/",
          title: "Main Landing Page",
          description:
            "Compare services, view rates, and request a fast quote on WhatsApp.",
        },
      ]}
      whatsappMessage="Hi Siargao Rides, I'd like a quote for a private airport transfer in Siargao."
    />
  );
}
