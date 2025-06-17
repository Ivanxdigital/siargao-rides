"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { MapPin, Clock, Users, Luggage, Shield, Droplets, Wind, Phone, CheckCircle, ArrowRight, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import VanHireBookingForm from "@/components/van-hire/VanHireBookingForm"

export default function VanHirePage() {
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)

  const popularRoutes = [
    {
      id: 'airport-luna',
      title: 'Sayak Airport → General Luna',
      price: '₱1,200',
      duration: '45 minutes',
      distance: '25 km'
    },
    {
      id: 'luna-airport',
      title: 'General Luna → Sayak Airport',
      price: '₱1,200',
      duration: '45 minutes',
      distance: '25 km'
    },
    {
      id: 'airport-cloud9',
      title: 'Sayak Airport → Cloud 9',
      price: '₱1,000',
      duration: '35 minutes',
      distance: '20 km'
    },
    {
      id: 'airport-pacifico',
      title: 'Sayak Airport → Pacifico',
      price: '₱1,800',
      duration: '1 hour 15 minutes',
      distance: '45 km'
    }
  ]

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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 w-full h-full">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/videos/siargao-hero.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Premium Private Van Service
            </h1>
            <p className="text-xl md:text-2xl mb-4 text-white/90">
              Sayak Airport Transfers • No Sharing • Premium Comfort
            </p>
            <p className="text-lg mb-8 text-white/80 max-w-2xl mx-auto">
              Comfortable, private transportation for families and groups. Air conditioning, complimentary water, and professional service included.
            </p>
            <div className="text-2xl md:text-3xl font-bold text-primary mb-8">
              From ₱1,000 - All Inclusive
            </div>
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/80 text-white px-8 py-6 text-lg"
              onClick={() => document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Book Your Van Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Popular Routes Section */}
      <section id="routes" className="py-20 bg-zinc-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Popular Routes</h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Choose from our most requested airport transfer routes
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {popularRoutes.map((route, index) => (
              <motion.div
                key={route.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="bg-zinc-800 border-zinc-700 hover:border-primary/50 transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                          {route.title}
                        </h3>
                        <div className="flex gap-4 text-sm text-white/70">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {route.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {route.distance}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{route.price}</div>
                        <div className="text-sm text-white/70">All inclusive</div>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20"
                      onClick={() => setSelectedRoute(route.id)}
                    >
                      Select This Route
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
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
                <p className="text-white/70">{step.description}</p>
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
                  <div className="text-4xl font-bold text-primary mb-2">Starting at ₱1,000</div>
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
                  className="w-full bg-primary hover:bg-primary/80 text-white"
                  onClick={() => document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Book Your Premium Van Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section id="booking-section" className="py-20 bg-zinc-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Book Your Van</h2>
            <p className="text-lg text-white/70">
              Complete your booking in just a few simple steps
            </p>
          </motion.div>
          
          <VanHireBookingForm initialRoute={selectedRoute || undefined} />
        </div>
      </section>
    </div>
  )
}