import type { Metadata } from "next";

import { PrivateVanServicePage } from "@/components/service-pages/private-van-service-page";
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
  return <PrivateVanServicePage path={pagePath} />;
}
