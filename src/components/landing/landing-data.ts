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

export const trustStripItems: IconTextItem[] = [
  { icon: Clock3, label: "No Waiting for Others" },
  { icon: Plane, label: "Flight Delay Monitoring" },
  { icon: Calendar, label: "Free Rescheduling" },
  { icon: Users, label: "Ideal for Families and Groups" },
];

export const serviceCards: ServiceItem[] = [
  {
    icon: Route,
    title: "Private Airport Transfer",
    description:
      "Easy private transfer between Sayak Airport (IAO) and your accommodation in General Luna or nearby areas.",
    bullets: [
      "Private point-to-point service with no shared van stops",
      "Roomy van for luggage, surfboards, and groups",
    ],
    price: "PHP 3,500",
    suffix: "/ one way",
    featured: false,
  },
  {
    icon: MapPinned,
    title: "8-Hour Private Day Hire",
    description:
      "A dedicated van and local driver for 8 hours. Great for day trips, custom routes, and relaxed island plans.",
    bullets: [
      "Includes experienced local driver and fuel for standard routes",
      "Flexible itinerary for your ideal Siargao land tour",
    ],
    price: "PHP 8,000",
    suffix: "/ 8 hours",
    featured: true,
  },
];

export const whyItems: WhyItem[] = [
  {
    icon: Armchair,
    title: "Comfort-first from pickup to drop-off",
    description:
      "Travel with only your group and enjoy spacious seating without the rush and uncertainty of shared transfers.",
  },
  {
    icon: House,
    title: "Door-to-door around the island",
    description:
      "No unnecessary stops. We bring you straight to your resort, villa, or homestay.",
  },
  {
    icon: Radar,
    title: "Professional, reliable, and easy to book",
    description:
      "From airport pickups to full-day tours, we focus on punctual, reliable, and friendly private van service.",
  },
];

export const steps: StepItem[] = [
  {
    number: "1",
    title: "Tell us your plan",
    description:
      "Message your date, pickup point, destination, and group size on WhatsApp.",
  },
  {
    number: "2",
    title: "Get your quote fast",
    description:
      "Receive transparent pricing for airport transfer or 8-hour private day hire.",
  },
  {
    number: "3",
    title: "Ride stress-free",
    description:
      "Your driver arrives on schedule so your airport transfer or land tour starts smoothly.",
  },
];

export const pricingItems: PricingItem[] = [
  {
    title: "Private Airport Transfer",
    price: "From PHP 3,500",
    description: "One-way private van transfer between IAO and General Luna.",
  },
  {
    title: "8-Hour Private Day Hire",
    price: "From PHP 8,000",
    description: "8-hour private van hire in Siargao with driver and fuel.",
  },
];

export const faqItems: FaqItem[] = [
  {
    question: "Can you do airport pickup and airport drop-off?",
    answer:
      "Yes. We handle both arrival and departure transfers between IAO Airport and your accommodation.",
  },
  {
    question: "Do you handle delayed flights?",
    answer:
      "Yes. Share your flight details when booking and we adjust pickup timing if your arrival changes.",
  },
  {
    question: "Can we book a private day hire for a land tour?",
    answer:
      "Absolutely. Our 8-hour private day hire is built for Siargao land tours and flexible group itineraries.",
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
  "Private Airport Transfer (One Way)",
  "8-Hour Private Day Hire",
] as const;

export const quotePassengerOptions = [
  "1-2 People",
  "3-4 People",
  "5-8 People",
  "9+ People",
] as const;

const defaultInquiryMessage =
  "Hi Siargao Rides, I'd like a quote for a private van hire in Siargao.";

export function buildWhatsappHref(message: string): string {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export const defaultWhatsappHref = buildWhatsappHref(defaultInquiryMessage);
