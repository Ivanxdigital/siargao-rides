"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { MapPin, Clock, Users, Luggage, Shield, Droplets, Wind, Phone, CheckCircle, ArrowRight, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import AuroraBackground from "@/components/ui/aurora-background"
import VanHireBookingForm from "@/components/van-hire/VanHireBookingForm"

export default function VanHirePage() {

  const features = [
    {
      icon: <Wind className="h-6 w-6" />,
      title: "Air Conditioning",
      description: "Cool comfort throughout your journey"
    },
    {
      icon: <Droplets className="h-6 w-6" />,
      title: "Complimentary Water",
      description: "Free bottled water for all passengers"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Professional Drivers",
      description: "Licensed, experienced, and reliable"
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: "Airport Pickup Signs",
      description: "Easy identification with name displays"
    },
    {
      icon: <Luggage className="h-6 w-6" />,
      title: "Spacious Storage",
      description: "Room for all your luggage and gear"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Private Transport",
      description: "No sharing with strangers"
    }
  ]

  const howItWorks = [
    {
      step: "1",
      title: "Select Route",
      description: "Choose your pickup and dropoff locations",
      icon: <MapPin className="h-8 w-8" />
    },
    {
      step: "2",
      title: "Book & Pay",
      description: "Select date, time, and passenger count",
      icon: <Clock className="h-8 w-8" />
    },
    {
      step: "3",
      title: "Enjoy Your Ride",
      description: "Relax in premium comfort to your destination",
      icon: <CheckCircle className="h-8 w-8" />
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-5rem)] lg:min-h-screen flex items-start lg:items-center justify-center overflow-hidden">
        {/* Aurora Background */}
        <div className="absolute inset-0 w-full h-full">
          <AuroraBackground className="w-full h-full">
            <div className="absolute inset-0 bg-black/40" />
          </AuroraBackground>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 pt-20 lg:pt-0 py-8 lg:py-0">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Hero Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Premium Private Van Service
              </h1>
              <p className="text-xl md:text-2xl mb-4 text-white/90">
                Sayak Airport Transfers • No Sharing • Premium Comfort
              </p>
              <p className="text-lg mb-8 text-white/80">
                Comfortable, private transportation for families and groups. Air conditioning, complimentary water, and professional service included.
              </p>
              <div className="text-2xl md:text-3xl font-bold text-primary mb-8">
                ₱2,500 - All Inclusive
              </div>
            </motion.div>
            
            {/* Booking Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <VanHireBookingForm />
            </motion.div>
          </div>
        </div>
      </section>


      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-b from-black via-zinc-950 to-zinc-900 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.08),transparent_70%)] opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,rgba(134,25,143,0.06),transparent_70%)] opacity-50"></div>
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-white/70">
              Simple, fast, and reliable booking process
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="bg-primary/10 border border-primary/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <span className="text-primary">{step.icon}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-white/70">{step.step === "1" ? "Enter your pickup and dropoff locations" : step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Features Section */}
      <section className="py-20 bg-zinc-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Premium Features Included</h2>
            <p className="text-lg text-white/70">
              Everything you need for a comfortable journey
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="bg-zinc-800 border-zinc-700 h-full">
                  <CardContent className="p-6 text-center">
                    <div className="bg-primary/10 border border-primary/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <span className="text-primary">{feature.icon}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-white/70">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Transparent Pricing</h2>
            <p className="text-lg text-white/70">
              No hidden fees. All-inclusive premium service.
            </p>
          </motion.div>

          <div className="max-w-2xl mx-auto">
            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="text-4xl font-bold text-primary mb-2">₱2,500</div>
                  <p className="text-white/70">Perfect for families, couples, and groups</p>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Air conditioning throughout journey</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Complimentary bottled water for all guests</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Professional, reliable drivers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Airport pickup with name signs</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Spacious luggage compartment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>No sharing with strangers</span>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Book Your Premium Van Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

    </div>
  )
}