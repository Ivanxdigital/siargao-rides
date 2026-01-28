import Image from "next/image"
import Link from "next/link"
import { Metadata } from "next"
import type { ReactNode } from "react"
import { Anchor, Map, MessageCircle, Shield, Sparkles, Users } from "lucide-react"
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_NUMBER } from "@/lib/whatsapp"

export const metadata: Metadata = {
  title: "Private Tours Siargao | Island Hopping & Land Tours | WhatsApp Booking",
  description:
    "Private tours in Siargao (no joiners): private island hopping and private land tours. WhatsApp-first booking with fast quotes and curated itineraries for couples and groups.",
  keywords:
    "private tours siargao, siargao private island hopping, private boat tour siargao, sugba lagoon private tour, sohoton private tour, siargao land tour private, luxury tour siargao, premium tour siargao, private travel siargao",
}

export default function ToursSiargaoPage() {
  const whatsappUrl = buildWhatsAppUrl({
    phoneNumber: DEFAULT_WHATSAPP_NUMBER,
    message:
      "Hi Siargao Rides! I'd like a quote for a private tour in Siargao.\n\n" +
      "Tour type (Private Island Hopping / Private Land Tour / Sugba Lagoon / Sohoton): \n" +
      "Date: \n" +
      "Guests: \n" +
      "Pickup location (if needed): \n" +
      "Preferred time: \n" +
      "Notes (celebration, special requests, pace): \n\n" +
      "Thank you!",
  })

  return (
    <div className="bg-black">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-bg-1.png"
            alt="Private tours in Siargao"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black" />
        </div>

        <div className="relative container mx-auto px-4 py-24 sm:py-28">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-white/80 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Private-only • Curated itineraries • WhatsApp-first
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Private Tours in Siargao
            </h1>

            <p className="mt-5 text-base text-white/75 sm:text-lg">
              Island hopping and land tours designed for couples and groups who want privacy, flexibility, and a premium
              experience — no joiners, no waiting.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-semibold text-black transition-colors hover:bg-primary/90"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp for a Tour Quote
              </a>
              <Link
                href="/airport-transfer-siargao"
                className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
              >
                Need an airport transfer?
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Private-only (no joiners)
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Couples & groups
              </div>
              <div className="flex items-center gap-2">
                <Map className="h-4 w-4 text-primary" />
                Local partner team
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tour types */}
      <section className="container mx-auto px-4 py-16 sm:py-20">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">Private tour options</h2>
        <p className="mt-3 max-w-2xl text-white/70">
          All tours are private-only and quote-based. Final pricing depends on group size, inclusions, and itinerary.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <TourCard
            icon={<Anchor className="h-5 w-5 text-primary" />}
            title="Private Island Hopping"
            description="Classic tri-island day (e.g., Guyam / Daku / Naked). Private boat, flexible pace, curated stops."
            href={whatsappUrl}
          />
          <TourCard
            icon={<Map className="h-5 w-5 text-primary" />}
            title="Private Sugba Lagoon Day"
            description="A private day trip coordinated end-to-end with our partnered provider. Ideal for groups and couples."
            href={whatsappUrl}
          />
          <TourCard
            icon={<Sparkles className="h-5 w-5 text-primary" />}
            title="Private Sohoton Day"
            description="A premium private day trip with tailored timing and logistics. Best for travelers wanting a smoother experience."
            href={whatsappUrl}
          />
        </div>
      </section>

      {/* Policy */}
      <section className="border-t border-white/10 bg-gradient-to-b from-black to-gray-900/40">
        <div className="container mx-auto px-4 py-16 sm:py-20">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Booking policy</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="text-lg font-semibold text-white">WhatsApp-first</div>
              <p className="mt-2 text-sm text-white/70">
                Send your preferred tour type, date, group size, and pickup location. We reply with a quote and the next
                steps to confirm.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="text-lg font-semibold text-white">Reconfirmation</div>
              <p className="mt-2 text-sm text-white/70">
                If no reservation fee is collected, we require reconfirmation a few hours before pickup. If you do not
                reconfirm, we automatically cancel.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function TourCard({
  icon,
  title,
  description,
  href,
}: {
  icon: ReactNode
  title: string
  description: string
  href: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg border border-white/10 bg-black/40 p-2">{icon}</div>
        <div className="text-lg font-semibold text-white">{title}</div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-white/70">{description}</p>
      <div className="mt-4 inline-flex items-center text-sm font-medium text-primary group-hover:text-primary/90">
        WhatsApp for quote →
      </div>
    </a>
  )
}
