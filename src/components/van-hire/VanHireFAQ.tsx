"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, HelpCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface FAQItem {
  question: string
  answer: string
}

export default function VanHireFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqItems: FAQItem[] = [
    {
      question: "How much does private van hire cost in Siargao?",
      answer: "Our private van hire service has a fixed rate of ₱2,500 for all destinations across Siargao Island. This includes air conditioning, complimentary water, professional drivers, and airport pickup with name signs. No hidden fees or surge pricing."
    },
    {
      question: "How long does it take from Sayak Airport to General Luna?",
      answer: "The journey from Sayak Airport to General Luna takes approximately 45 minutes covering 35 kilometers. Our professional drivers know the best routes and will ensure a comfortable, safe journey to your destination."
    },
    {
      question: "Can I book a van for multiple passengers and luggage?",
      answer: "Yes! Our private vans accommodate up to 8 passengers with spacious luggage compartments. Perfect for families, groups, and travelers with multiple bags. The ₱2,500 rate covers all passengers and standard luggage."
    },
    {
      question: "Do you provide airport pickup with name signs?",
      answer: "Absolutely! Our drivers will be waiting at Sayak Airport with name signs for easy identification. No need to search - we'll find you and help with your luggage for a seamless start to your Siargao adventure."
    },
    {
      question: "Is the van air-conditioned throughout the journey?",
      answer: "Yes, all our private vans feature reliable air conditioning systems to keep you cool and comfortable throughout your journey, especially important during hot tropical weather in Siargao."
    },
    {
      question: "Can I book van hire for custom routes around Siargao?",
      answer: "Yes! While we have fixed pricing for popular routes, we also accommodate custom destinations around Siargao Island. Contact us for pricing on special routes or multi-stop journeys across the island."
    },
    {
      question: "How far in advance should I book private van hire?",
      answer: "We recommend booking at least 24 hours in advance to ensure availability, especially during peak season. However, we also accept same-day bookings subject to vehicle availability."
    },
    {
      question: "What's included in the ₱2,500 private van hire rate?",
      answer: "The ₱2,500 rate includes: air-conditioned private van, professional licensed driver, complimentary bottled water, airport pickup with name signs, spacious luggage storage, and door-to-door service. No additional fees."
    }
  ]

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <>
      {/* FAQ Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqItems.map(item => ({
              "@type": "Question",
              "name": item.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
              }
            }))
          })
        }}
      />

      <section className="py-20 bg-zinc-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <HelpCircle className="h-8 w-8 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold">
                Frequently Asked Questions
              </h2>
            </div>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Everything you need to know about our private van hire service in Siargao
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="mb-4"
              >
                <Card className="bg-zinc-800 border-zinc-700 overflow-hidden">
                  <CardContent className="p-0">
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-zinc-750 transition-colors"
                    >
                      <h3 className="font-semibold text-lg pr-4">{item.question}</h3>
                      <ChevronDown 
                        className={`h-5 w-5 text-primary transition-transform ${
                          openIndex === index ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    
                    <AnimatePresence>
                      {openIndex === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="px-6 pb-6 pt-0">
                            <div className="border-t border-zinc-700 pt-6">
                              <p className="text-white/80 leading-relaxed">{item.answer}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}