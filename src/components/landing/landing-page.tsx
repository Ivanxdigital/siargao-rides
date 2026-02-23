import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  defaultWhatsappHref,
  faqItems,
  navigationLinks,
  pricingItems,
  serviceCards,
  steps,
  trustStripItems,
  whyItems,
} from "@/components/landing/landing-data";
import { QuoteForm } from "@/components/landing/quote-form";
import { Reveal } from "@/components/landing/reveal";

const containerClass = "mx-auto max-w-6xl px-6";

export function LandingPage() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Siargao Rides",
    url: siteUrl || undefined,
    image: siteUrl ? `${siteUrl}/logo-brand.png` : undefined,
    areaServed: "Siargao Island, Philippines",
    telephone: "+63 999 370 2550",
    sameAs: [defaultWhatsappHref],
    description:
      "Private van hire in Siargao for airport transfers and all-day land tours with professional local drivers.",
    makesOffer: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Private Van Airport Transfer Siargao",
          description:
            "Private van airport transfer between Siargao Airport (IAO) and accommodations around Siargao.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "All Day Van Hire in Siargao",
          description:
            "8-hour private van hire in Siargao for land tours and custom island routes.",
        },
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <div className="bg-slate-900 px-4 py-2.5 text-center text-xs font-medium tracking-wide text-white">
        Private van rides in Siargao for airport trips and full-day island plans.
        <a
          href="#pricing"
          className="ml-1 underline underline-offset-2 opacity-80 transition-opacity hover:opacity-100"
        >
          View rates
        </a>
      </div>

      <nav className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className={`${containerClass} flex h-16 items-center justify-between`}>
          <a href="#" aria-label="Siargao Rides home">
            <Image
              src="/logo-brand.png"
              alt="Siargao Rides"
              width={4139}
              height={1138}
              priority
              className="h-auto w-[146px] sm:w-[164px] md:w-[142px] lg:w-[154px]"
            />
          </a>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-500 md:flex">
            {navigationLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-slate-900"
              >
                {link.label}
              </a>
            ))}
          </div>

          <Button
            asChild
            className="hidden rounded-full bg-emerald-600 px-5 py-2.5 text-sm text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-700 md:inline-flex"
          >
            <a href={defaultWhatsappHref} target="_blank" rel="noopener noreferrer">
              <PhoneCall className="h-4 w-4" />
              Book via WhatsApp
            </a>
          </Button>
        </div>
      </nav>

      <div className="fixed right-6 bottom-6 left-6 z-50 md:hidden">
        <Reveal delay={0.3}>
          <a
            href={defaultWhatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 py-4 text-sm font-medium text-white shadow-xl shadow-emerald-600/20 transition-transform active:scale-95"
          >
            <PhoneCall className="h-4 w-4" />
            Get Quote on WhatsApp
          </a>
        </Reveal>
      </div>

      <main>
        <header className="relative overflow-hidden bg-white pt-20 pb-24 md:pt-32 md:pb-32">
          <div className={`${containerClass} relative z-10 text-center`}>
            <Reveal>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Professional Local Drivers
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <h1 className="mx-auto mb-6 max-w-4xl text-4xl leading-[1.1] font-semibold tracking-tighter text-slate-900 md:text-6xl lg:text-7xl">
                Ride Siargao Your Way.
                <br />
                <span className="text-slate-400">
                  Private Airport Transfers and Day Tours.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-slate-500 md:text-lg">
                If you are searching for reliable van hire in Siargao, you are
                in the right place. We provide private airport transfers and
                8-hour day hire for land tours, family outings, and custom
                island itineraries.
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  asChild
                  className="h-14 w-full rounded-full bg-slate-900 px-8 text-sm text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 sm:w-auto"
                >
                  <a
                    href={defaultWhatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message on WhatsApp
                  </a>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-14 w-full rounded-full border-slate-200 bg-white px-8 text-sm text-slate-900 hover:bg-slate-50 sm:w-auto"
                >
                  <a href="#quote-form">Request a Quote</a>
                </Button>
              </div>
            </Reveal>

            <Reveal delay={0.4} className="mx-auto mt-20 max-w-5xl">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200/50 bg-slate-100 shadow-2xl shadow-slate-200/50 md:aspect-[21/9] md:rounded-[2rem]">
                <Image
                  src="/daku-island.webp"
                  alt="Daku Island in Siargao"
                  fill
                  priority
                  className="object-cover opacity-95"
                  sizes="(max-width: 768px) 100vw, 1200px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/25 to-transparent" />
                <div className="absolute bottom-6 left-6 flex gap-3 md:bottom-10 md:left-10">
                  <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-slate-900 shadow-sm backdrop-blur-sm">
                    <ShieldCheck className="h-4 w-4" />
                    Private Rides Only
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </header>

        <section className="border-y border-slate-100 bg-white py-10">
          <div
            className={`${containerClass} flex flex-col items-center justify-center gap-8 text-center text-sm font-medium text-slate-500 md:flex-row md:gap-16`}
          >
            {trustStripItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-slate-400" />
                  {item.label}
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white py-14">
          <div className={`${containerClass} text-center`}>
            <h2 className="mx-auto mb-4 max-w-3xl text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              Comfortable private transport for travelers who value smooth
              timing, clear communication, and professional service.
            </h2>
            <p className="mx-auto max-w-4xl text-base leading-relaxed text-slate-500">
              From airport arrival to all-day exploring, we help you move around
              Siargao with less hassle and more confidence in your schedule.
            </p>
          </div>
        </section>

        <section id="services" className="bg-slate-50 py-24">
          <div className={containerClass}>
            <Reveal className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                Choose Your Service
              </h2>
              <p className="mx-auto max-w-xl text-base text-slate-500">
                Two clear options: direct airport transfer or 8-hour private day
                hire for land tours and custom routes.
              </p>
            </Reveal>

            <div className="grid gap-6 md:grid-cols-2 md:gap-8">
              {serviceCards.map((service, index) => {
                const Icon = service.icon;

                return (
                  <Reveal key={service.title} delay={0.1 + index * 0.1}>
                    <article
                      className={`flex h-full flex-col rounded-3xl border p-8 md:p-10 ${
                        service.featured
                          ? "border-slate-800 bg-slate-900 shadow-xl shadow-slate-900/5"
                          : "border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                      }`}
                    >
                      <div
                        className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border ${
                          service.featured
                            ? "border-slate-700 bg-slate-800 text-white"
                            : "border-slate-100 bg-slate-50 text-slate-700"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>

                      <h3
                        className={`mb-2 text-2xl font-semibold tracking-tight ${
                          service.featured ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {service.title}
                      </h3>

                      <p
                        className={`mb-6 flex-grow text-sm leading-relaxed ${
                          service.featured ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {service.description}
                      </p>

                      <ul
                        className={`mb-8 space-y-3 text-sm font-medium ${
                          service.featured ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {service.bullets.map((bullet) => (
                          <li key={bullet} className="flex items-start gap-3">
                            <CheckCircle2
                              className={`mt-0.5 h-5 w-5 ${
                                service.featured
                                  ? "text-emerald-400"
                                  : "text-emerald-500"
                              }`}
                            />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>

                      <div
                        className={`mt-auto flex items-center justify-between border-t pt-6 ${
                          service.featured ? "border-slate-800" : "border-slate-100"
                        }`}
                      >
                        <div>
                          <span
                            className={`mb-0.5 block text-xs ${
                              service.featured ? "text-slate-500" : "text-slate-400"
                            }`}
                          >
                            Starting at
                          </span>
                          <span
                            className={`text-lg font-semibold ${
                              service.featured ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {service.price}
                          </span>{" "}
                          <span
                            className={`text-xs ${
                              service.featured ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {service.suffix}
                          </span>
                        </div>

                        <a
                          href="#quote-form"
                          className={`inline-flex items-center gap-1 text-sm font-medium transition-colors ${
                            service.featured
                              ? "text-white hover:text-emerald-400"
                              : "text-slate-900 hover:text-emerald-600"
                          }`}
                        >
                          Book now
                          <ArrowRight className="h-4 w-4" />
                        </a>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className={`${containerClass} grid items-center gap-16 lg:grid-cols-2`}>
            <Reveal>
              <h2 className="mb-6 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                Why travelers book with us.
              </h2>
              <p className="mb-10 text-base leading-relaxed text-slate-500">
                Most guests tell us the same thing: they want transport that
                feels easy from the first message. We keep booking simple,
                communication clear, and rides on time.
              </p>

              <div className="space-y-8">
                {whyItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex gap-4">
                      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="mb-1 text-base font-semibold text-slate-900">
                          {item.title}
                        </h3>
                        <p className="text-sm text-slate-500">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Reveal>

            <Reveal delay={0.2} className="relative">
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-slate-100">
                <Image
                  src="/happy-passengers.jpg"
                  alt="Happy passengers in a private van in Siargao"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 600px"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-xl md:block">
                <div className="mb-1 text-sm font-semibold text-slate-900">
                  Fast Responses
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  Typically replies in minutes
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="how-it-works" className="bg-slate-900 py-24 text-white">
          <div className={`${containerClass} text-center`}>
            <Reveal>
              <h2 className="mb-16 text-3xl font-semibold tracking-tight md:text-4xl">
                Book in 3 simple steps
              </h2>
            </Reveal>

            <div className="relative grid gap-12 md:grid-cols-3">
              <div className="absolute top-6 left-[20%] right-[20%] hidden h-px bg-slate-800 md:block" />
              {steps.map((step, index) => (
                <Reveal key={step.number} delay={0.1 + index * 0.1} className="relative z-10">
                  <div
                    className={`mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full border-4 border-slate-900 text-sm font-semibold ${
                      index === steps.length - 1
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 text-emerald-400"
                    }`}
                  >
                    {step.number}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                  <p className="px-4 text-sm leading-relaxed text-slate-400">
                    {step.description}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-slate-50 py-24">
          <div className={containerClass}>
            <div className="grid gap-16 lg:grid-cols-12">
              <Reveal className="lg:col-span-5">
                <h2 className="mb-6 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                  Clear, Transparent Rates.
                </h2>
                <p className="mb-10 text-base text-slate-500">
                  Premium private service with clear pricing. Rates are per
                  vehicle, not per person.
                </p>

                <div className="mb-10 space-y-6">
                  {pricingItems.map((item) => (
                    <div key={item.title} className="space-y-2 pb-6">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-base font-semibold text-slate-900">
                          {item.title}
                        </h3>
                        <span className="text-base font-semibold text-slate-900">
                          {item.price}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{item.description}</p>
                      <Separator className="bg-slate-200" />
                    </div>
                  ))}
                </div>

                <p className="text-xs leading-relaxed text-slate-400">
                  Prices are starting estimates. Final quote can vary based on
                  location, unusual delays, and custom requests.
                </p>
              </Reveal>

              <Reveal delay={0.2} className="lg:col-span-7" >
                <div id="quote-form">
                  <QuoteForm />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section id="faq" className="border-y border-slate-100 bg-white py-24">
          <div className="mx-auto max-w-3xl px-6">
            <Reveal className="text-center">
              <h2 className="mb-12 text-3xl font-semibold tracking-tight text-slate-900">
                Frequently Asked Questions
              </h2>
            </Reveal>

            <Reveal delay={0.1} className="space-y-8">
              {faqItems.map((item, index) => (
                <div key={item.question}>
                  <h3 className="mb-2 text-base font-semibold text-slate-900">
                    {item.question}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-500">{item.answer}</p>
                  {index < faqItems.length - 1 ? (
                    <Separator className="mt-8 bg-slate-100" />
                  ) : null}
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        <section className="relative overflow-hidden bg-slate-900 px-6 py-24 text-center">
          <div className="pointer-events-none absolute top-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[100px]" />

          <Reveal className="relative z-10 mx-auto max-w-2xl">
            <h2 className="mb-6 text-3xl font-semibold tracking-tighter text-white md:text-5xl">
              Ready for a smoother ride in Siargao?
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-base text-slate-400">
              Send your route and date on WhatsApp and we will reply with a
              clear quote for airport transfer or private day hire.
            </p>
            <Button
              asChild
              className="h-14 rounded-full bg-white px-8 text-base text-slate-900 shadow-lg hover:bg-slate-50"
            >
              <a href={defaultWhatsappHref} target="_blank" rel="noopener noreferrer">
                <PhoneCall className="h-5 w-5" />
                Message on WhatsApp
              </a>
            </Button>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-slate-100 bg-white pt-12 pb-28 md:pb-12">
        <div
          className={`${containerClass} flex flex-col items-center justify-between gap-6 md:flex-row`}
        >
          <div className="flex flex-col items-center gap-2 md:items-start">
            <a href="#" aria-label="Siargao Rides home">
              <Image
                src="/logo-brand.png"
                alt="Siargao Rides"
                width={4139}
                height={1138}
                className="h-auto w-[172px] sm:w-[186px] md:w-[150px] lg:w-[164px]"
              />
            </a>
            <span className="text-xs text-slate-400">
              Private van hire in Siargao for airport transfers and land tours.
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
            <a
              href={defaultWhatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-slate-900"
            >
              WhatsApp Support
            </a>
          </div>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
    </>
  );
}
