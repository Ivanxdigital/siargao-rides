import { absoluteUrl } from "@/lib/seo";

type FaqItem = {
  question: string;
  answer: string;
};

type BreadcrumbItem = {
  name: string;
  path: string;
};

type ServiceSchemaInput = {
  name: string;
  description: string;
  path: string;
  areaServed: string;
  priceFrom?: number;
  priceCurrency?: string;
};

export function buildLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Siargao Rides",
    url: absoluteUrl("/"),
    image: absoluteUrl("/logo-brand.png"),
    areaServed: "Siargao Island, Philippines",
    telephone: "+63 999 370 2550",
    description:
      "Private van hire in Siargao for airport transfers and all-day land tours with professional local drivers.",
  };
}

export function buildServiceSchema(input: ServiceSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    areaServed: input.areaServed,
    provider: {
      "@type": "LocalBusiness",
      name: "Siargao Rides",
      url: absoluteUrl("/"),
      telephone: "+63 999 370 2550",
    },
    offers:
      input.priceFrom !== undefined
        ? {
            "@type": "Offer",
            price: input.priceFrom,
            priceCurrency: input.priceCurrency ?? "PHP",
            availability: "https://schema.org/InStock",
            url: absoluteUrl(input.path),
          }
        : undefined,
  };
}

export function buildFaqSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
