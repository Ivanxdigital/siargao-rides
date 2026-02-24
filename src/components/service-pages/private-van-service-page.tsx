import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Luggage,
  MessageCircle,
  Route,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";

import { buildWhatsappHref } from "@/components/landing/landing-data";
import { Reveal } from "@/components/landing/reveal";
import { siteNavLinks } from "@/components/navigation/nav-links";
import { SiteNavbar } from "@/components/navigation/site-navbar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildServiceSchema,
} from "@/lib/schema";

type PrivateVanServicePageProps = {
  path: string;
};

type ComparisonRow = {
  label: string;
  privateVan: string;
  alternatives: string;
};

type CapacityCard = {
  groupSize: string;
  setup: string;
  bestFor: string;
};

type UseCaseCard = {
  title: string;
  description: string;
  bullets: string[];
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

const heroPoints = ["No shared stops", "Door-to-door service", "Fast WhatsApp booking"];

const comparisonRows: ComparisonRow[] = [
  {
    label: "Privacy",
    privateVan: "Vehicle is reserved only for your group",
    alternatives: "Often shared with other passengers",
  },
  {
    label: "Route flexibility",
    privateVan: "Custom pickup/drop-off and planned stopovers",
    alternatives: "Limited to fixed route or app-based availability",
  },
  {
    label: "Waiting time",
    privateVan: "No waiting for other passengers. Once you land and board, we go straight to your accommodation.",
    alternatives: "Shared vans usually wait for more passengers to arrive before departure.",
  },
  {
    label: "Luggage and surf gear",
    privateVan: "Planned capacity for bags and surfboards",
    alternatives: "Vehicle size varies per booking",
  },
  {
    label: "Communication",
    privateVan: "Single WhatsApp thread from quote to ride",
    alternatives: "Split across app updates or changing drivers",
  },
];

const capacityCards: CapacityCard[] = [
  {
    groupSize: "1 to 2 guests",
    setup: "Comfort-focused private transfer setup",
    bestFor: "Couples, business travelers, and quick direct trips",
  },
  {
    groupSize: "3 to 5 guests",
    setup: "Balanced seating with space for day bags",
    bestFor: "Families and friend groups with mixed itineraries",
  },
  {
    groupSize: "6 to 8+ guests",
    setup: "Group-ready van layout with larger luggage planning",
    bestFor: "Surf groups, events, and multi-accommodation pickups",
  },
];

const useCases: UseCaseCard[] = [
  {
    title: "Airport + check-in day",
    description:
      "Avoid arrival-day friction with one direct route from airport to your stay.",
    bullets: [
      "Reliable pickup timing",
      "Direct drop-off",
      "Luggage-first setup",
    ],
  },
  {
    title: "Family and group transport",
    description:
      "Keep everyone together with one vehicle and one coordinated schedule.",
    bullets: [
      "No split cars",
      "Less waiting",
      "Easier trip planning",
    ],
  },
  {
    title: "Custom island movement",
    description:
      "Flexible routing for transfers, meal stops, and activity schedules.",
    bullets: [
      "Door-to-door routing",
      "Fast communication",
      "Comfort-first rides",
    ],
  },
];

const includedItems = [
  "Private vehicle reserved only for your group",
  "Local professional driver",
  "Direct pickup and drop-off across General Luna and nearby areas",
  "Support for luggage, surfboards, and family travel",
];

const bookingNotes = [
  "Extremely remote or out-of-scope routes may adjust final rates",
  "Entry tickets, meals, and personal expenses",
  "Late-night or special scheduling surcharges when applicable",
];

const faqItems: FaqItem[] = [
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
];

const relatedLinks: RelatedLink[] = [
  {
    href: "/airport-transfer-siargao",
    title: "Airport Transfer Siargao",
    description: "Private pickup and drop-off between IAO Airport and your accommodation.",
  },
  {
    href: "/land-tours-siargao",
    title: "Land Tours Siargao",
    description: "Book an 8-hour private van with driver for custom island day plans.",
  },
  {
    href: "/",
    title: "Main Landing Page",
    description: "View full service overview, rates, FAQs, and quick quote options.",
  },
];

const whatsappMessage =
  "Hi Siargao Rides, I'd like a quote for private van hire in Siargao.";

export function PrivateVanServicePage({ path }: PrivateVanServicePageProps) {
  const whatsappHref = buildWhatsappHref(whatsappMessage);

  const serviceSchema = buildServiceSchema({
    name: "Private Van Hire in Siargao",
    description:
      "Premium private van hire in Siargao for airport pickups, hotel transfers, and custom island transport plans.",
    path,
    areaServed: "Siargao Island, Philippines",
    priceFrom: 3500,
    priceCurrency: "PHP",
  });

  const faqSchema = buildFaqSchema(faqItems);

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Private Van Hire in Siargao", path },
  ]);

  return (
    <>
      <div className="bg-slate-900 px-4 py-2.5 text-center text-xs font-medium tracking-wide text-white">
        Premium private van rides across Siargao.
      </div>

      <SiteNavbar whatsappHref={whatsappHref} />

      <div className="fixed right-5 bottom-5 left-5 z-50 lg:hidden">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 py-4 text-sm font-medium text-white shadow-xl shadow-emerald-600/20 transition-transform active:scale-95"
        >
          <MessageCircle className="h-4 w-4" />
          Get Van Quote on WhatsApp
        </a>
      </div>

      <main>
        <header className="relative overflow-hidden border-b border-slate-100 bg-white">
          <div className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-[90px]" />

          <div
            className={`${containerClass} relative grid gap-8 pt-14 pb-12 sm:pt-16 sm:pb-14 lg:grid-cols-[1.06fr_0.94fr] lg:items-center`}
          >
            <div>
              <Reveal>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Private rides only
                </div>
              </Reveal>

              <Reveal delay={0.05}>
                <h1 className="text-balance text-4xl leading-tight font-semibold tracking-tight text-slate-900 sm:text-5xl">
                  Private Van Hire in Siargao
                </h1>
              </Reveal>

              <Reveal delay={0.1}>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
                  Reliable, premium van service for travelers who want smooth schedules,
                  direct routes, and comfort from pickup to drop-off.
                </p>
              </Reveal>

              <Reveal delay={0.15}>
                <div className="mt-6 flex flex-wrap gap-2.5 text-xs sm:text-sm">
                  {heroPoints.map((point) => (
                    <span
                      key={point}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={0.2}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    asChild
                    className="h-12 rounded-full bg-slate-900 px-7 text-sm text-white hover:bg-slate-800"
                  >
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" />
                      Message for Van Hire
                    </a>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="h-12 rounded-full border-slate-200 bg-white px-7 text-sm text-slate-900 hover:bg-slate-50"
                  >
                    <a href="#comparison">Compare Options</a>
                  </Button>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.2}>
              <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="relative aspect-[16/10]">
                    <Image
                      src="/happy-passengers.jpg"
                      alt="Happy passengers using private van hire in Siargao"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 480px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                    <span className="absolute right-3 bottom-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate-700 backdrop-blur-sm">
                      Private group ride
                    </span>
                  </div>

                  <div className="grid gap-4 p-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                        Starting rate
                      </p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                        PHP 3,500
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                        Typical use
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-700">Airport and island routes</p>
                    </div>
                  </div>
                </div>
              </aside>
            </Reveal>
          </div>

          <div className={`${containerClass} pb-10 sm:pb-12`}>
            <Reveal delay={0.25}>
              <div className="-mx-2 overflow-x-auto px-2 pb-1">
                <div className="inline-flex min-w-full gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-2 text-xs font-medium text-slate-600 sm:text-sm">
                  <a href="#comparison" className="rounded-xl bg-white px-3 py-2 transition-colors hover:text-slate-900">
                    Comparison
                  </a>
                  <a href="#capacity" className="rounded-xl px-3 py-2 transition-colors hover:bg-white hover:text-slate-900">
                    Capacity
                  </a>
                  <a href="#use-cases" className="rounded-xl px-3 py-2 transition-colors hover:bg-white hover:text-slate-900">
                    Use Cases
                  </a>
                  <a href="#faq" className="rounded-xl px-3 py-2 transition-colors hover:bg-white hover:text-slate-900">
                    FAQ
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </header>

        <section id="comparison" className="bg-slate-900 py-14 text-white sm:py-16">
          <div className={containerClass}>
            <Reveal>
              <h2 className="text-3xl font-semibold tracking-tight">Private Van vs Alternatives</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                A quick side-by-side view to help you decide when private van hire is the
                better fit for your trip style.
              </p>
            </Reveal>

            <Reveal delay={0.1} className="mt-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/40">
              <div className="hidden grid-cols-[0.95fr_1fr_1fr] border-b border-slate-800 bg-slate-900/60 text-sm font-semibold md:grid">
                <div className="px-5 py-4 text-slate-300">Category</div>
                <div className="px-5 py-4 text-emerald-300">Private Van Hire</div>
                <div className="px-5 py-4 text-slate-300">Shared / Ride-hailing</div>
              </div>

              <div className="divide-y divide-slate-800">
                {comparisonRows.map((row, index) => (
                  <div key={row.label} className="grid gap-3 px-5 py-5 md:grid-cols-[0.95fr_1fr_1fr] md:gap-4">
                    <p className="text-sm font-semibold text-white">{row.label}</p>
                    <p className="text-sm text-emerald-200">{row.privateVan}</p>
                    <p className="text-sm text-slate-300">{row.alternatives}</p>
                    {index < comparisonRows.length - 1 ? <Separator className="bg-slate-800 md:hidden" /> : null}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section id="capacity" className="bg-white py-14 sm:py-16">
          <div className={`${containerClass} grid gap-6 lg:grid-cols-[1.05fr_0.95fr]`}>
            <div className="space-y-4">
              <Reveal>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Group Size and Luggage Planning
                </h2>
                <p className="text-sm leading-relaxed text-slate-500 sm:text-base">
                  Share your passenger count and luggage details first. We match your trip with
                  the right private setup before confirming.
                </p>
              </Reveal>

              <div className="grid gap-4">
                {capacityCards.map((card, index) => (
                  <Reveal key={card.groupSize} delay={0.08 + index * 0.06}>
                    <article className="rounded-2xl border border-slate-100 bg-slate-50 p-5 transition-shadow hover:shadow-sm">
                      <p className="text-sm font-semibold text-slate-900">{card.groupSize}</p>
                      <p className="mt-2 text-sm text-slate-600">{card.setup}</p>
                      <p className="mt-2 text-xs text-slate-500">{card.bestFor}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>

            <Reveal delay={0.16}>
              <aside className="rounded-3xl border border-slate-100 bg-slate-50 p-6 lg:sticky lg:top-24">
                <h3 className="text-xl font-semibold tracking-tight text-slate-900">Booking Snapshot</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  Send route, date, group size, and luggage count. We reply with a clear
                  private-van quote and any route notes.
                </p>

                <div className="mt-6 space-y-3 text-sm text-slate-600">
                  <p className="flex items-start gap-2">
                    <Users className="mt-0.5 h-4 w-4 text-emerald-600" />
                    Private setup for your group only
                  </p>
                  <p className="flex items-start gap-2">
                    <Luggage className="mt-0.5 h-4 w-4 text-emerald-600" />
                    Planned luggage and surfboard support
                  </p>
                  <p className="flex items-start gap-2">
                    <Route className="mt-0.5 h-4 w-4 text-emerald-600" />
                    Flexible island routing by request
                  </p>
                  <p className="flex items-start gap-2">
                    <Clock3 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    Fast WhatsApp response flow
                  </p>
                </div>

                <Button
                  asChild
                  className="mt-7 h-12 w-full rounded-full bg-slate-900 text-sm text-white hover:bg-slate-800"
                >
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    Get Private Van Quote
                  </a>
                </Button>
              </aside>
            </Reveal>
          </div>
        </section>

        <section id="use-cases" className="bg-slate-50 py-14 sm:py-16">
          <div className={containerClass}>
            <Reveal>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                Built for High-Comfort Trip Scenarios
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
                Pick the private setup that matches your schedule pressure, luggage profile, and
                group dynamics.
              </p>
            </Reveal>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {useCases.map((card, index) => (
                <Reveal key={card.title} delay={0.08 + index * 0.08}>
                  <article className="group h-full rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <h3 className="text-base font-semibold text-slate-900">{card.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{card.description}</p>

                    <ul className="mt-4 space-y-2 text-sm text-slate-600">
                      {card.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16">
          <div className={`${containerClass} grid gap-6 lg:grid-cols-2`}>
            <Reveal>
              <article className="rounded-3xl border border-slate-100 bg-slate-50 p-7 sm:p-8">
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
            </Reveal>

            <Reveal delay={0.08}>
              <article className="rounded-3xl border border-slate-100 bg-slate-50 p-7 sm:p-8">
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
              </article>
            </Reveal>
          </div>
        </section>

        <section id="faq" className="bg-white py-14 sm:py-16">
          <div className={`${containerClass} grid gap-8 lg:grid-cols-[0.9fr_1.1fr]`}>
            <Reveal>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Frequently Asked Questions
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
                  Key details for booking private van service around Siargao.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="space-y-6">
                {faqItems.map((item, index) => (
                  <article key={item.question}>
                    <h3 className="text-base font-semibold text-slate-900">{item.question}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.answer}</p>
                    {index < faqItems.length - 1 ? <Separator className="mt-6 bg-slate-100" /> : null}
                  </article>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section className="bg-slate-50 py-14 sm:py-16">
          <div className={containerClass}>
            <Reveal>
              <h2 className="mb-6 text-3xl font-semibold tracking-tight text-slate-900">
                Explore Related Services
              </h2>
            </Reveal>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedLinks.map((link, index) => (
                <Reveal key={link.href} delay={0.08 + index * 0.06}>
                  <Link
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
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-900 px-5 py-16 text-center text-white sm:py-20">
          <Reveal className="mx-auto max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Professional local drivers
            </div>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Need a private van in Siargao?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Send your route and date on WhatsApp for a fast, clear quote.
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
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-slate-100 bg-white pt-10 pb-24 lg:pb-10">
        <div className={`${containerClass} flex flex-col gap-6 md:flex-row md:items-center md:justify-between`}>
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
