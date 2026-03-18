import { Star } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";

const testimonials = [
  {
    name: "James Carter",
    country: "UK",
    serviceTag: "Airport Transfer",
    quote:
      "Booked an airport pickup through Siargao Rides and everything was seamless. Driver was already waiting when we landed, super friendly, and the van was clean and comfortable. After a long flight, this made such a difference. Highly recommend.",
  },
  {
    name: "Sofia Martinez",
    country: "Spain",
    serviceTag: "Day Tour",
    quote:
      "We used Siargao Rides for a full island day tour and it was honestly one of the highlights of our trip. The driver knew all the best spots and even helped us plan our itinerary. Super smooth experience from start to finish.",
  },
  {
    name: "Aiko Tanaka",
    country: "Japan",
    serviceTag: "Airport Transfer",
    quote:
      "Everything was perfectly organized. The driver was polite and punctual, and the van was very clean. I felt very comfortable traveling alone using Siargao Rides.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            What Our Guests Say
          </h2>
          <p className="mx-auto max-w-xl text-base text-slate-500">
            Real reviews from travelers who have booked private van hire in
            Siargao with us.
          </p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, index) => (
            <Reveal key={t.name} delay={0.1 + index * 0.1}>
              <div className="flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-6 flex-grow text-base leading-relaxed text-slate-600 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.country}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {t.serviceTag}
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
