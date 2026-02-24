import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MessageCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { buildWhatsappHref } from "@/components/landing/landing-data";
import { siteNavLinks } from "@/components/navigation/nav-links";
import { SiteNavbar } from "@/components/navigation/site-navbar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildServiceSchema,
} from "@/lib/schema";

type FaqItem = {
  question: string;
  answer: string;
};

type RelatedLink = {
  href: string;
  title: string;
  description: string;
};

type ServicePageTemplateProps = {
  path: string;
  heroBadge: string;
  title: string;
  description: string;
  proofPoints: string[];
  serviceName: string;
  serviceDescription: string;
  startingPrice: string;
  startingPriceValue?: number;
  included: string[];
  excluded: string[];
  bestFor: string[];
  processSteps: string[];
  faqItems: FaqItem[];
  relatedLinks: RelatedLink[];
  whatsappMessage: string;
};

const containerClass = "mx-auto w-full max-w-6xl px-5 sm:px-6";

export function ServicePageTemplate(props: ServicePageTemplateProps) {
  const whatsappHref = buildWhatsappHref(props.whatsappMessage);

  const serviceSchema = buildServiceSchema({
    name: props.serviceName,
    description: props.serviceDescription,
    path: props.path,
    areaServed: "Siargao Island, Philippines",
    priceFrom: props.startingPriceValue,
    priceCurrency: "PHP",
  });

  const faqSchema = buildFaqSchema(props.faqItems);

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: props.serviceName, path: props.path },
  ]);

  return (
    <>
      <div className="bg-slate-900 px-4 py-2.5 text-center text-xs font-medium tracking-wide text-white">
        Premium private van service across Siargao.
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
          Get Quote on WhatsApp
        </a>
      </div>

      <main>
        <header className="bg-white pt-16 pb-14 sm:pt-20 sm:pb-20">
          <div className={`${containerClass}`}>
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {props.heroBadge}
              </div>

              <h1 className="text-balance text-4xl leading-tight font-semibold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                {props.title}
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
                {props.description}
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm">
                {props.proofPoints.map((point) => (
                  <span
                    key={point}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600"
                  >
                    {point}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </header>

        <section className="bg-slate-50 py-14 sm:py-20">
          <div className={`${containerClass} grid gap-6 lg:grid-cols-2`}>
            <article className="rounded-3xl border border-slate-100 bg-white p-7 shadow-sm sm:p-9">
              <h2 className="mb-5 text-2xl font-semibold tracking-tight text-slate-900">
                What&apos;s Included
              </h2>
              <ul className="space-y-3 text-sm text-slate-600">
                {props.included.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-3xl border border-slate-100 bg-white p-7 shadow-sm sm:p-9">
              <h2 className="mb-5 text-2xl font-semibold tracking-tight text-slate-900">
                Booking Notes
              </h2>
              <ul className="space-y-3 text-sm text-slate-600">
                {props.excluded.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <XCircle className="mt-0.5 h-5 w-5 text-slate-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Separator className="my-6 bg-slate-100" />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                    Starting Rate
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                    {props.startingPrice}
                  </p>
                </div>
                <Clock3 className="mt-1 h-5 w-5 text-slate-400" />
              </div>
            </article>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-20">
          <div className={containerClass}>
            <h2 className="mb-6 text-center text-3xl font-semibold tracking-tight text-slate-900">
              Best For Travelers Who Want
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {props.bestFor.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm leading-relaxed text-slate-600"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-900 py-14 text-white sm:py-20">
          <div className={containerClass}>
            <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight">
              Book in 3 Steps
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {props.processSteps.map((step, index) => (
                <article
                  key={step}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6"
                >
                  <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-300">{step}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-20">
          <div className={`${containerClass} grid gap-6 lg:grid-cols-2`}>
            <div>
              <h2 className="mb-5 text-3xl font-semibold tracking-tight text-slate-900">
                Frequently Asked Questions
              </h2>
              <p className="text-sm leading-relaxed text-slate-500">
                Clear answers for booking private van service in Siargao.
              </p>
            </div>

            <div className="space-y-6">
              {props.faqItems.map((item, index) => (
                <article key={item.question}>
                  <h3 className="text-base font-semibold text-slate-900">{item.question}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.answer}</p>
                  {index < props.faqItems.length - 1 ? (
                    <Separator className="mt-6 bg-slate-100" />
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-14 sm:py-20">
          <div className={containerClass}>
            <h2 className="mb-6 text-3xl font-semibold tracking-tight text-slate-900">
              Explore Related Services
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {props.relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group rounded-2xl border border-slate-100 bg-white p-5 transition-shadow hover:shadow-md"
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
          </div>
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
