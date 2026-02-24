import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Luggage,
  MapPinned,
  MessageCircle,
  PlaneLanding,
  Route,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";

import { buildWhatsappHref } from "@/components/landing/landing-data";
import { MobileWhatsAppCta } from "@/components/navigation/mobile-whatsapp-cta";
import { siteNavLinks } from "@/components/navigation/nav-links";
import { SiteNavbar } from "@/components/navigation/site-navbar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildServiceSchema,
} from "@/lib/schema";

type AirportTransferPageProps = {
  path: string;
};

type TimelineStep = {
  icon: LucideIcon;
  title: string;
  description: string;
  timeHint: string;
};

type RouteTime = {
  route: string;
  eta: string;
  note: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type RelatedLink = {
  href: string;
  title: string;
  description: string;
};

const containerClass = "mx-auto w-full max-w-6xl px-5 sm:px-6";

const heroProofPoints = [
  "Private transfer only",
  "Flight delay coordination",
  "Door-to-door hotel drop-off",
];

const transferTimeline: TimelineStep[] = [
  {
    icon: PlaneLanding,
    title: "Arrival Monitoring",
    description: "Share your flight details and we track schedule changes before landing.",
    timeHint: "Before arrival",
  },
  {
    icon: MessageCircle,
    title: "Driver Coordination",
    description: "You receive pickup details and WhatsApp confirmation on arrival day.",
    timeHint: "After touchdown",
  },
  {
    icon: Luggage,
    title: "Fast Meet-up",
    description: "Your group boards one private van with luggage and surfboard space.",
    timeHint: "Within minutes",
  },
  {
    icon: Route,
    title: "Direct Transfer",
    description: "Ride straight to your accommodation without shared van detours.",
    timeHint: "One-way route",
  },
];

const routeTimes: RouteTime[] = [
  {
    route: "IAO Airport -> General Luna",
    eta: "45 to 60 min",
    note: "Most requested route for hotels and villas in town.",
  },
  {
    route: "IAO Airport -> Tourism Road / Cloud 9",
    eta: "50 to 65 min",
    note: "Typical timing for hostels, resorts, and surf camps near Cloud 9.",
  },
  {
    route: "IAO Airport -> North / East stays",
    eta: "30 to 70+ min",
    note: "Depends on exact town (for example Santa Fe to Pacifico), traffic, and weather.",
  },
];

const includedItems = [
  "Private airport transfer reserved for your group only",
  "Direct IAO pickup and accommodation drop-off",
  "Driver coordination based on your arrival or departure details",
  "Space for luggage, hand-carry items, and surfboards",
];

const bookingNotes = [
  "Extra waiting from major itinerary changes not shared in advance",
  "Multi-stop custom routes (available by custom quote)",
  "Fees unrelated to the transport service",
];

const bestForItems = [
  "Guests arriving with heavy luggage who want a smooth handoff from airport to hotel",
  "Families and groups who prefer privacy over shared transfers",
  "Travelers with fixed check-in plans and tight arrival windows",
];

const faqItems: FaqItem[] = [
  {
    question: "Do you monitor delayed flights?",
    answer:
      "Yes. Share your flight details and we adjust pickup timing when arrival changes.",
  },
  {
    question: "Can you do both arrival and departure transfers?",
    answer: "Yes. We handle one-way and round-trip airport transfer requests.",
  },
  {
    question: "Where do you drop us off?",
    answer:
      "We provide door-to-door drop-off in General Luna and surrounding areas, with custom quotes for remote routes.",
  },
];

const relatedLinks: RelatedLink[] = [
  {
    href: "/private-van-hire-siargao",
    title: "Private Van Hire Siargao",
    description: "Dedicated van service for airport transfers and flexible island transport.",
  },
  {
    href: "/land-tours-siargao",
    title: "Land Tours Siargao",
    description: "8-hour private day hire for custom tours and relaxed island plans.",
  },
  {
    href: "/",
    title: "Main Landing Page",
    description: "Compare services, view rates, and request a fast quote on WhatsApp.",
  },
];

const whatsappMessage =
  "Hi Siargao Rides, I'd like a quote for a private airport transfer in Siargao.";

export function AirportTransferServicePage({ path }: AirportTransferPageProps) {
  const whatsappHref = buildWhatsappHref(whatsappMessage);

  const serviceSchema = buildServiceSchema({
    name: "Private Van Airport Transfer Siargao",
    description:
      "Private airport transfer service in Siargao between Sayak Airport (IAO) and accommodations around General Luna and nearby areas.",
    path,
    areaServed: "Siargao Island, Philippines",
    priceFrom: 3500,
    priceCurrency: "PHP",
  });

  const faqSchema = buildFaqSchema(faqItems);

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Private Van Airport Transfer Siargao", path },
  ]);

  return (
    <>
      <div className="bg-slate-900 px-4 py-2.5 text-center text-xs font-medium tracking-wide text-white">
        Airport pickup from IAO with private vans only.
      </div>

      <SiteNavbar whatsappHref={whatsappHref} />

      <MobileWhatsAppCta
        href={whatsappHref}
        label="Get Airport Quote on WhatsApp"
        icon={<MessageCircle className="h-4 w-4" />}
        className="fixed right-5 bottom-5 left-5 z-50 lg:hidden"
      />

      <main>
        <header className="relative overflow-hidden border-b border-slate-100 bg-white">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[32rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[90px]" />

          <div
            className={`${containerClass} relative grid gap-8 pt-14 pb-14 sm:pt-16 sm:pb-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-10`}
          >
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                IAO airport private pickup
              </div>

              <h1 className="text-balance text-4xl leading-tight font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Private Van Pick Up Service in Siargao
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
                Door-to-door airport transfer with professional local drivers, fast response
                times, and direct routing to your accommodation.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2.5 text-xs sm:text-sm">
                {heroProofPoints.map((point) => (
                  <span
                    key={point}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600"
                  >
                    {point}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  className="h-12 rounded-full bg-slate-900 px-7 text-sm text-white hover:bg-slate-800"
                >
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    Message for Airport Pickup
                  </a>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-full border-slate-200 bg-white px-7 text-sm text-slate-900 hover:bg-slate-50"
                >
                  <a href="#travel-times">Check Typical Travel Times</a>
                </Button>
              </div>
            </div>

            <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="relative aspect-[16/10]">
                  <Image
                    src="/airport-at-siargao-7.png"
                    alt="Passengers arriving at Siargao Airport"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 420px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/45 to-transparent" />
                  <p className="absolute right-3 bottom-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate-700 backdrop-blur-sm">
                    IAO to General Luna
                  </p>
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                        Starting Rate
                      </p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                        From PHP 3,500
                      </p>
                      <p className="text-xs text-slate-500">One way private airport transfer</p>
                    </div>
                    <Clock3 className="h-5 w-5 text-slate-400" />
                  </div>

                  <Separator className="bg-slate-100" />

                  <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <p className="flex items-start gap-2">
                      <PlaneLanding className="mt-0.5 h-4 w-4 text-emerald-500" />
                      Delay-aware pickup planning
                    </p>
                    <p className="flex items-start gap-2">
                      <Users className="mt-0.5 h-4 w-4 text-emerald-500" />
                      Group-ready van capacity
                    </p>
                    <p className="flex items-start gap-2 sm:col-span-2">
                      <MapPinned className="mt-0.5 h-4 w-4 text-emerald-500" />
                      Door-to-door drop-off across General Luna and nearby areas
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </header>

        <section className="bg-slate-900 py-14 text-white sm:py-16">
          <div className={containerClass}>
            <h2 className="text-3xl font-semibold tracking-tight">Airport Transfer Flow</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              A clear, arrival-first flow so your pickup feels coordinated from touchdown
              to hotel check-in.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {transferTimeline.map((step, index) => {
                const Icon = step.icon;

                return (
                  <article
                    key={step.title}
                    className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold">
                        {index + 1}
                      </div>
                      <span className="text-xs font-medium text-slate-400">{step.timeHint}</span>
                    </div>
                    <Icon className="mb-3 h-5 w-5 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      {step.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="travel-times" className="bg-white py-14 sm:py-16">
          <div className={containerClass}>
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Popular Airport Transfer Routes
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
                  Typical transfer windows to help you plan check-in and day schedules.
                </p>
              </div>
              <p className="text-xs text-slate-400">Actual timing varies by traffic and weather.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {routeTimes.map((item) => (
                <article
                  key={item.route}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-5"
                >
                  <p className="text-sm font-semibold text-slate-900">{item.route}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{item.eta}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.note}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-14 sm:py-16">
          <div className={`${containerClass} grid gap-6 lg:grid-cols-[1.1fr_0.9fr]`}>
            <article className="rounded-3xl border border-slate-100 bg-white p-7 shadow-sm sm:p-8">
              <h2 className="mb-5 text-2xl font-semibold tracking-tight text-slate-900">
                What&apos;s Included
              </h2>
              <ul className="space-y-3 text-sm text-slate-600">
                {includedItems.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-3xl border border-slate-100 bg-white p-7 shadow-sm sm:p-8">
              <h2 className="mb-5 text-2xl font-semibold tracking-tight text-slate-900">
                Booking Notes
              </h2>
              <ul className="space-y-3 text-sm text-slate-600">
                {bookingNotes.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <XCircle className="mt-0.5 h-5 w-5 text-slate-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Separator className="my-6 bg-slate-100" />

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Send your flight number, arrival time, and accommodation in one message for a
                faster quote.
              </div>
            </article>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16">
          <div className={containerClass}>
            <h2 className="mb-6 text-3xl font-semibold tracking-tight text-slate-900">
              Best For Travelers Who Want
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {bestForItems.map((item) => (
                <article
                  key={item}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm leading-relaxed text-slate-600"
                >
                  {item}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16">
          <div className={`${containerClass} grid gap-8 lg:grid-cols-[0.9fr_1.1fr]`}>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                Frequently Asked Questions
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
                Quick answers before you lock your airport pickup schedule.
              </p>
            </div>

            <div className="space-y-6">
              {faqItems.map((item, index) => (
                <article key={item.question}>
                  <h3 className="text-base font-semibold text-slate-900">{item.question}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.answer}</p>
                  {index < faqItems.length - 1 ? <Separator className="mt-6 bg-slate-100" /> : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-14 sm:py-16">
          <div className={containerClass}>
            <h2 className="mb-6 text-3xl font-semibold tracking-tight text-slate-900">
              Explore Related Services
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group block rounded-2xl border border-slate-100 bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <h3 className="text-base font-semibold text-slate-900">{link.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{link.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-slate-900">
                    View details
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-900 px-5 py-16 text-center text-white sm:py-20">
          <div className="mx-auto max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Professional local drivers
            </div>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Need a private airport transfer in Siargao?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Share your flight and route details on WhatsApp for a fast, clear quote.
            </p>
            <Button
              asChild
              className="mt-8 h-12 rounded-full bg-white px-7 text-sm text-slate-900 hover:bg-slate-50 sm:h-14 sm:text-base"
            >
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                Get Quote on WhatsApp
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 bg-white pt-10 pb-24 lg:pb-10">
        <div
          className={`${containerClass} flex flex-col gap-6 md:flex-row md:items-center md:justify-between`}
        >
          <div className="flex items-center gap-3">
            <Image
              src="/logo-brand.png"
              alt="Siargao Rides"
              width={4139}
              height={1138}
              className="h-auto w-[152px]"
            />
            <p className="text-xs text-slate-400">Private van hire in Siargao.</p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            {siteNavLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-slate-900">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
