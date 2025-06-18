"use client"

import { motion } from "framer-motion"
import { Shield, Wind, MapPin, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
}

export default function WhyBookVanHire() {
  const features: Feature[] = [
    {
      icon: <Wind className="h-8 w-8" />,
      title: "Air-Conditioned Comfort",
      description: "Cool, comfortable ride throughout your journey with reliable AC system"
    },
    {
      icon: <MapPin className="h-8 w-8" />,
      title: "Door-to-Door Service",
      description: "Direct pickup and dropoff at your exact location - no walking required"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Fully Insured & Licensed",
      description: "Professional drivers with valid licenses and comprehensive insurance coverage"
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Fixed Rate - No Surge",
      description: "₱2,500 all-inclusive rate with no hidden fees or surge pricing"
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-b from-zinc-900 to-black relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(20,184,166,0.06),transparent_60%)] opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,rgba(134,25,143,0.04),transparent_60%)] opacity-40"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Book a Private Van with Siargao Rides?
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Experience the difference with our premium private van service - designed for comfort, safety, and convenience
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="bg-zinc-800/50 border-zinc-700/50 backdrop-blur-sm h-full hover:bg-zinc-800/70 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="bg-primary/10 border border-primary/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-primary">{feature.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}