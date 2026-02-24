import type { Metadata } from "next";

import { ServicePageTemplate } from "@/components/service-pages/service-page-template";
import { absoluteUrl } from "@/lib/seo";

const pagePath = "/private-van-hire-siargao";

export const metadata: Metadata = {
  title: "Private Van Hire Siargao | Premium Door-to-Door Transport",
  description:
    "Book private van hire in Siargao for airport trips and custom island routes. Spacious vehicles, professional local drivers, and fast WhatsApp quotes.",
  keywords: [
    "private van hire siargao",
    "van hire in siargao",
    "private van service siargao",
  ],
  alternates: {
    canonical: pagePath,
  },
  openGraph: {
    title: "Private Van Hire Siargao | Premium Door-to-Door Transport",
    description:
      "Comfort-first private van hire in Siargao for airport transfers and custom island plans.",
    url: absoluteUrl(pagePath),
    type: "website",
    images: [
      {
        url: absoluteUrl("/happy-passengers.jpg"),
        width: 1200,
        height: 630,
        alt: "Private van hire in Siargao",
      },
    ],
  },
};

export default function PrivateVanHirePage() {
  return (
    <ServicePageTemplate
      path={pagePath}
      heroBadge="Private rides only"
      title="Private Van Hire in Siargao"
      description="Reliable, premium van service for travelers who want smooth schedules, direct routes, and comfort from pickup to drop-off."
      proofPoints={[
        "No shared stops",
        "Door-to-door service",
        "Fast WhatsApp booking",
      ]}
      serviceName="Private Van Hire in Siargao"
      serviceDescription="Premium private van hire in Siargao for airport pickups, hotel transfers, and custom island transport plans."
      startingPrice="From PHP 3,500"
      startingPriceValue={3500}
      included={[
        "Private vehicle reserved only for your group",
        "Local professional driver",
        "Direct pickup and drop-off across General Luna and nearby areas",
        "Support for luggage, surfboards, and family travel",
      ]}
      excluded={[
        "Extremely remote or out-of-scope routes may adjust final rates",
        "Entry tickets, meals, and personal expenses",
        "Late-night or special scheduling surcharges when applicable",
      ]}
      bestFor={[
        "Families and groups who prefer comfort and privacy",
        "Travelers with large luggage or surf equipment",
        "Guests who want clear planning and less transport stress",
      ]}
      processSteps={[
        "Send your date, pickup point, destination, and group size on WhatsApp.",
        "Receive a transparent quote with all key details before confirmation.",
        "Your driver arrives on time so your trip starts smoothly.",
      ]}
      faqItems={[
        {
          question: "Is this shared with other passengers?",
          answer:
            "No. This is private van hire, so the vehicle is reserved only for your group.",
        },
        {
          question: "Can you handle surfboards and extra luggage?",
          answer:
            "Yes. Share your luggage details in advance and we will assign the right vehicle setup.",
        },
        {
          question: "Do you cover locations outside General Luna?",
          answer:
            "Yes, we cover General Luna and surrounding areas. Very remote routes may require a custom quote.",
        },
      ]}
      relatedLinks={[
        {
          href: "/airport-transfer-siargao",
          title: "Airport Transfer Siargao",
          description:
            "Private pickup and drop-off between IAO Airport and your accommodation.",
        },
        {
          href: "/land-tours-siargao",
          title: "Land Tours Siargao",
          description:
            "Book an 8-hour private van with driver for custom island day plans.",
        },
        {
          href: "/",
          title: "Main Landing Page",
          description:
            "View full service overview, rates, FAQs, and quick quote options.",
        },
      ]}
      whatsappMessage="Hi Siargao Rides, I'd like a quote for private van hire in Siargao."
    />
  );
}
