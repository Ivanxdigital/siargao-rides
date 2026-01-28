import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import { MessageCircle, Plane, Car, Sparkles, Shield, Clock, Users, Map } from "lucide-react"
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_NUMBER } from "@/lib/whatsapp"

export default function HomePage() {
  const whatsappUrl = buildWhatsAppUrl({
    phoneNumber: DEFAULT_WHATSAPP_NUMBER,
    message:
      "Hi Siargao Rides! I'd like a quote for a private service.\n\n" +
      "Service (Airport Transfer / All-day Private Van / Private Tour): \n" +
      "Date: \n" +
      "Time: \n" +
      "Pickup location: \n" +
      "Destination: \n" +
      "Passengers: \n" +
      "Luggage / surfboards: \n",
  })

  return (
    <div className="bg-black">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-bg-1.png"
            alt="Private van hire and private tours in Siargao"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black" />
        </div>

        <div className="relative container mx-auto px-4 py-24 sm:py-28 lg:py-32">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-white/80 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Private-only • Premium service • WhatsApp-first
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Private Van Hire & Private Tours in Siargao
            </h1>

            <p className="mt-5 text-base text-white/75 sm:text-lg">
              Airport pickup/drop-off, all-day private van hire, and curated private tours — built for groups, couples, and
              travelers who want convenience, comfort, and privacy.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/35 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-white">
                  <Plane className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Airport ↔ General Luna</span>
                </div>
                <div className="mt-2 text-3xl font-black text-primary">₱3,000</div>
                <div className="mt-1 text-sm text-white/70">One-way • Private • Other routes: quote via WhatsApp</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/35 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-white">
                  <Car className="h-5 w-5 text-primary" />
                  <span className="font-semibold">All-day private van hire</span>
                </div>
                <div className="mt-2 text-3xl font-black text-primary">₱8,000</div>
                <div className="mt-1 text-sm text-white/70">Ideal for land tours • Custom itinerary • Private only</div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-semibold text-black transition-colors hover:bg-primary/90"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp for a Quote
              </a>
              <div className="flex gap-3">
                <Link
                  href="/airport-transfer-siargao"
                  className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
                >
                  Airport Transfer
                </Link>
                <Link
                  href="/tours-siargao"
                  className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
                >
                  Private Tours
                </Link>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Private-only (no joiners)
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Fast WhatsApp replies
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Groups & couples
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="container mx-auto px-4 py-16 sm:py-20">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">What we offer</h2>
        <p className="mt-3 max-w-2xl text-white/70">
          Premium private transport and tours across Siargao, coordinated end-to-end via WhatsApp.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ServiceCard
            icon={<Plane className="h-5 w-5 text-primary" />}
            title="Private airport transfers"
            description="Door-to-door, no waiting. Fixed ₱3,000 one-way for Airport ↔ General Luna. Custom quotes for other destinations."
            href="/airport-transfer-siargao"
          />
          <ServiceCard
            icon={<Car className="h-5 w-5 text-primary" />}
            title="All-day private van hire"
            description="Ideal for land tours and flexible itineraries. Fixed ₱8,000 all day (temporary rate)."
            href="/private-van-hire-siargao"
          />
          <ServiceCard
            icon={<Map className="h-5 w-5 text-primary" />}
            title="Private tours (land & island)"
            description="Curated private island hopping and land tours through our partnered provider. Quote-based and private-only."
            href="/tours-siargao"
          />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/10 bg-gradient-to-b from-black to-gray-900/40">
        <div className="container mx-auto px-4 py-16 sm:py-20">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">How it works</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <StepCard
              step="01"
              title="Message us on WhatsApp"
              description="Tell us your date, time, pickup point, destination, and number of guests."
            />
            <StepCard
              step="02"
              title="We quote + confirm"
              description="We send the best option and confirm details with our driver/partner team."
            />
            <StepCard
              step="03"
              title="Private service, start to finish"
              description="No shared rides, no joiners — just you and your group."
            />
          </div>

          <div className="mt-10 rounded-xl border border-white/10 bg-black/40 p-6 text-white/80">
            <div className="font-semibold text-white">Cash payment + reconfirmation policy</div>
            <p className="mt-2 text-sm text-white/70">
              We accept cash on pickup / when the driver picks you up. If no reservation fee is collected, we require a
              reconfirmation a few hours before pickup — no reconfirmation means the booking is automatically cancelled.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function ServiceCard({
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
    <Link
      href={href}
      className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg border border-white/10 bg-black/40 p-2">{icon}</div>
        <div className="text-lg font-semibold text-white">{title}</div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-white/70">{description}</p>
      <div className="mt-4 text-sm font-medium text-primary group-hover:text-primary/90">Learn more →</div>
    </Link>
  )
}

function StepCard({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="text-sm font-semibold text-primary">{step}</div>
      <div className="mt-2 text-lg font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm text-white/70">{description}</p>
    </div>
  )
}
