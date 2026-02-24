import type { Metadata } from "next";

import { AirportTransferServicePage } from "@/components/service-pages/airport-transfer-service-page";
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
  return <AirportTransferServicePage path={pagePath} />;
}
