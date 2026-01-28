"use client"

import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Mail, MapPin, MessageCircle, Shield, Clock } from "lucide-react"
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_NUMBER } from "@/lib/whatsapp"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { when: "beforeChildren", staggerChildren: 0.08, duration: 0.4 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } },
}

export default function ContactClient() {
  const whatsappUrl = buildWhatsAppUrl({
    phoneNumber: DEFAULT_WHATSAPP_NUMBER,
    message:
      "Hi Siargao Rides! I'd like a quote for a private service.\n\n" +
      "Service (Airport Transfer / All-day Private Van / Private Tour): \n" +
      "Date: \n" +
      "Time: \n" +
      "Pickup location: \n" +
      "Destination: \n" +
      "Guests: \n",
  })

  return (
    <motion.div className="min-h-screen pt-20" initial="hidden" animate="visible" variants={containerVariants}>
      <section className="relative bg-gradient-to-b from-black to-gray-900 text-white overflow-hidden min-h-screen">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-900/30" />
        </div>

        <div className="container mx-auto px-4 py-12 relative z-10">
          <motion.div className="text-center mb-10" variants={itemVariants}>
            <Badge className="mb-4 text-sm bg-primary/20 text-primary border-primary/30 backdrop-blur-sm">
              WhatsApp-first
            </Badge>
            <h1 className="text-3xl font-bold">Contact Siargao Rides</h1>
            <p className="text-gray-300 mt-2 max-w-2xl mx-auto">
              For bookings and quotes, please message us on WhatsApp. We only offer private van hire and private tours.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <motion.div
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              variants={itemVariants}
            >
              <h2 className="text-xl font-semibold mb-4">Fastest way to book</h2>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-6 py-3 font-semibold text-black transition-colors hover:bg-primary/90"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp +63 999 370 2550
              </a>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium text-white">Private-only</div>
                    <div className="text-gray-400">No shared rides or joiner tours.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium text-white">Quick replies</div>
                    <div className="text-gray-400">We confirm details via WhatsApp.</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-xs text-gray-400">
                If no reservation fee is collected, we require reconfirmation a few hours before pickup. No reconfirmation
                means automatic cancellation.
              </div>
            </motion.div>

            <motion.div
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              variants={itemVariants}
            >
              <h2 className="text-xl font-semibold mb-4">Other contact details</h2>

              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <div className="font-medium text-white">Based in</div>
                    <div className="text-gray-300">
                      General Luna, Siargao Island
                      <div className="text-gray-400 text-sm">Surigao del Norte, Philippines</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <div className="font-medium text-white">Email</div>
                    <a href="mailto:siargaorides@gmail.com" className="text-gray-300 hover:text-primary transition-colors">
                      siargaorides@gmail.com
                    </a>
                    <div className="text-gray-400 text-sm">Best for non-urgent questions.</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </motion.div>
  )
}

