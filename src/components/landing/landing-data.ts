import type { LucideIcon } from "lucide-react";
import {
  Armchair,
  Calendar,
  Clock3,
  House,
  MapPinned,
  Radar,
  Route,
  Users,
  Plane,
} from "lucide-react";

type LinkItem = {
  href: string;
  label: string;
};

type IconTextItem = {
  icon: LucideIcon;
  label: string;
};

type ServiceItem = {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
  price: string;
  suffix: string;
  featured: boolean;
};

type WhyItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type StepItem = {
  number: string;
  title: string;
  description: string;
};

type PricingItem = {
  title: string;
  price: string;
  description: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

const configuredWhatsappNumber =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "639993702550";

export const whatsappNumber = configuredWhatsappNumber.replace(/\D/g, "");

export const navigationLinks: LinkItem[] = [
  { href: "#services", label: "Services" },
  { href: "#how-it-works", label: "How it Works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export const trustStripItems: IconTextItem[] = [
  { icon: Clock3, label: "No Waiting for Others" },
  { icon: Plane, label: "Flight Delay Monitoring" },
  { icon: Calendar, label: "Free Rescheduling" },
  { icon: Users, label: "Families and Groups Welcome" },
];

export const serviceCards: ServiceItem[] = [
  {
    icon: Route,
    title: "Airport Transfer",
    description:
      "Direct one-way private transfer between Siargao Airport (IAO) and your accommodation in General Luna or nearby areas.",
    bullets: [
      "Private point-to-point ride with no shared stops",
      "Plenty of room for luggage and surfboards",
    ],
    price: "PHP 3,500",
    suffix: "/ one way",
    featured: false,
  },
  {
    icon: MapPinned,
    title: "Private Day Hire",
    description:
      "Your private van and professional local driver for 8 hours. Ideal for land tours, group travel, and custom island itineraries.",
    bullets: [
      "Includes experienced local driver and fuel",
      "Build your own route based on your schedule",
    ],
    price: "PHP 8,000",
    suffix: "/ 8 hours",
    featured: true,
  },
];

export const whyItems: WhyItem[] = [
  {
    icon: Armchair,
    title: "Comfortable private experience",
    description:
      "Travel only with your group and enjoy spacious seating without the rush of shared vans.",
  },
  {
    icon: House,
    title: "Direct to your accommodation",
    description:
      "No multiple drop-offs. We take you straight to your villa, resort, or homestay.",
  },
  {
    icon: Radar,
    title: "Flight monitoring included",
    description:
      "We track your arrival so pickups stay coordinated even when flights are delayed.",
  },
];

export const steps: StepItem[] = [
  {
    number: "1",
    title: "Send your trip details",
    description:
      "Share your date, time, route, and group size through WhatsApp.",
  },
  {
    number: "2",
    title: "Get a clear quote fast",
    description:
      "We confirm pricing quickly so you can finalize transport without guesswork.",
  },
  {
    number: "3",
    title: "Meet your private driver",
    description:
      "Your van arrives on schedule so your transfer or day tour starts smoothly.",
  },
];

export const pricingItems: PricingItem[] = [
  {
    title: "Airport Transfer",
    price: "From PHP 3,500",
    description: "One-way private transfer between IAO and General Luna.",
  },
  {
    title: "Private Day Hire",
    price: "From PHP 8,000",
    description: "8-hour private van service with driver and fuel.",
  },
];

export const faqItems: FaqItem[] = [
  {
    question: "Do you handle delayed flights?",
    answer:
      "Yes. Share your flight details when booking and we adjust pickup timing if your arrival changes.",
  },
  {
    question: "Can you drop us at any accommodation in Siargao?",
    answer:
      "Yes, we provide door-to-door service in General Luna and surrounding areas. Remote drop-offs can affect final pricing.",
  },
  {
    question: "Is fuel included for the 8-hour day hire?",
    answer:
      "Yes. Standard island routes include vehicle, driver, and fuel.",
  },
  {
    question: "How do we pay?",
    answer:
      "Payment is finalized in WhatsApp during confirmation. We typically support cash, GCash, and local bank transfer options.",
  },
];

export const quoteServiceOptions = [
  "Airport Transfer (One Way)",
  "Private Day Hire (8 Hours)",
] as const;

export const quotePassengerOptions = [
  "1-2 People",
  "3-4 People",
  "5-8 People",
  "9+ People",
] as const;

const defaultInquiryMessage =
  "Hi Siargao Rides, I'd like a quote for a private van service in Siargao.";

export function buildWhatsappHref(message: string): string {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export const defaultWhatsappHref = buildWhatsappHref(defaultInquiryMessage);
