"use client"

import { motion } from "framer-motion"
import { MapPin, Clock, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Route {
  from: string
  to: string
  travelTime: string
  distance: string
  description: string
}

interface LandTour {
  name: string
  duration: string
  destinations: string[]
  highlights: string
  price: string
}

export default function PopularRoutes() {
  const routes: Route[] = [
    {
      from: "Sayak Airport",
      to: "General Luna Accommodations",
      travelTime: "45 mins",
      distance: "35 km",
      description: "Airport pickup to your hotel, resort, or accommodation"
    },
    {
      from: "General Luna Accommodations",
      to: "Sayak Airport",
      travelTime: "45 mins",
      distance: "35 km",
      description: "Reliable departure transfer for your flight connection"
    },
    {
      from: "Sayak Airport",
      to: "Dapa Accommodations",
      travelTime: "25 mins",
      distance: "18 km",
      description: "Direct transfer to northern Siargao accommodations"
    },
    {
      from: "Dapa Accommodations",
      to: "Sayak Airport",
      travelTime: "25 mins",
      distance: "18 km",
      description: "Convenient departure transfer from northern Siargao"
    }
  ]

  const landTours: LandTour[] = [
    {
      name: "North Island Explorer",
      duration: "8 hours",
      destinations: ["Magpupungko Rock Pools", "Sohoton Cove", "Taktak Falls"],
      highlights: "Natural pools, cave exploration, and pristine waterfalls",
      price: "₱5,500"
    },
    {
      name: "South Coast Adventure",
      duration: "8 hours",
      destinations: ["Cloud 9", "Pacifico Beach", "Coconut Palm Forest"],
      highlights: "World-famous surf spot, secluded beaches, scenic drives",
      price: "₱5,500"
    },
    {
      name: "Island Hopping Combo",
      duration: "8 hours",
      destinations: ["Guyam Island", "Naked Island", "Daku Island"],
      highlights: "Three pristine islands with lunch and snorkeling",
      price: "₱5,500"
    },
    {
      name: "Lagoon & Caves Tour",
      duration: "8 hours",
      destinations: ["Sugba Lagoon", "Sohoton Cove", "Hagukan Cave"],
      highlights: "Kayaking, spelunking, and hidden lagoons",
      price: "₱5,500"
    }
  ]

  const handleBookNow = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section className="py-20 bg-zinc-950 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.04),transparent_70%)] opacity-60"></div>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M0 0h80v80H0V0zm20 20v40h40V20H20zm20 35a15 15 0 1 1 0-30 15 15 0 0 1 0 30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Our Van Hire Services
          </h2>
          <p className="text-lg text-white/70 max-w-3xl mx-auto">
            Choose from airport transfers or full-day land tours around Siargao
          </p>
        </motion.div>

        {/* Airport Transfer Routes */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              Airport Transfer Routes
            </h3>
            <p className="text-lg text-white/70">
              Fixed ₱2,500 rate for all airport connections
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {routes.map((route, index) => (
            <motion.div
              key={`${route.from}-${route.to}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="bg-zinc-800/60 border-zinc-700/60 backdrop-blur-sm hover:bg-zinc-800/80 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 border border-primary/20 rounded-full w-10 h-10 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{route.from}</span>
                          <ArrowRight className="h-4 w-4 text-primary" />
                          <span className="font-medium">{route.to}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{route.travelTime}</span>
                    </div>
                    <div className="text-sm text-white/60">
                      {route.distance}
                    </div>
                  </div>
                  
                  <p className="text-white/70 text-sm mb-4">{route.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-primary font-bold text-lg">₱2,500</div>
                    <div className="text-xs text-white/50">Fixed rate</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          </div>
        </div>

        {/* Land Tour Packages */}
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              Full-Day Land Tours
            </h3>
            <p className="text-lg text-white/70">
              Complete island exploration packages - ₱5,500 per van
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {landTours.map((tour, index) => (
              <motion.div
                key={tour.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="bg-zinc-800/60 border-zinc-700/60 backdrop-blur-sm hover:bg-zinc-800/80 transition-all duration-300 h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-lg">{tour.name}</h4>
                      <div className="text-primary font-bold text-xl">{tour.price}</div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{tour.duration}</span>
                      <span className="text-white/60 text-sm">• Full day experience</span>
                    </div>
                    
                    <div className="mb-4">
                      <h5 className="font-medium text-sm mb-2">Key Destinations:</h5>
                      <div className="space-y-1">
                        {tour.destinations.map((destination, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-white/80">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            <span>{destination}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-white/70 text-sm mb-4">{tour.highlights}</p>
                    
                    <div className="text-xs text-white/50">
                      Includes: Professional driver, fuel, van for full day
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <Button 
            size="lg"
            onClick={handleBookNow}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3"
          >
            Check Availability
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-white/60 mt-3">
            Custom airport routes and tour combinations available
          </p>
        </motion.div>
      </div>
    </section>
  )
}