"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { MapPin, Calendar, Clock, Users, Luggage, MessageSquare, ArrowRight, Loader2, Car, Map } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

export default function VanHireBookingForm() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Service Type
    serviceType: 'airport-transfer' as 'airport-transfer' | 'land-tour',
    
    // Route Information
    pickupLocation: '',
    dropoffLocation: '',
    customPickup: '',
    customDropoff: '',
    pickupInstructions: '',
    landTourStops: [] as string[],
    
    // Date & Time
    date: '',
    time: '',
    isImmediate: false,
    
    // Passenger Information
    passengerCount: 1,
    luggageCount: 1,
    
    // Contact Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Special Requests
    specialRequests: '',
    
    // Pricing
    estimatedPrice: 0,
    estimatedDuration: 0
  })

  const airportTransferLocations = [
    { value: 'sayak-airport', label: 'Sayak Airport', category: 'airport' },
    { value: 'general-luna', label: 'General Luna Accommodations', category: 'accommodation' },
    { value: 'dapa', label: 'Dapa Accommodations', category: 'accommodation' },
    { value: 'pacifico', label: 'Pacifico Accommodations', category: 'accommodation' },
    { value: 'custom', label: 'Custom Address', category: 'custom' }
  ]

  const landTourDestinations = [
    { value: 'cloud-9', label: 'Cloud 9 Surf Spot', category: 'attraction' },
    { value: 'pacifico', label: 'Pacifico Beach', category: 'beach' },
    { value: 'sugba-lagoon', label: 'Sugba Lagoon', category: 'lagoon' },
    { value: 'magpupungko', label: 'Magpupungko Rock Pools', category: 'attraction' },
    { value: 'sohoton-cove', label: 'Sohoton Cove', category: 'cove' },
    { value: 'taktak-falls', label: 'Taktak Falls', category: 'waterfall' },
    { value: 'naked-island', label: 'Naked Island', category: 'island' },
    { value: 'guyam-island', label: 'Guyam Island', category: 'island' }
  ]

  const timeSlots = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
  ]

  const handleLocationChange = (field: 'pickupLocation' | 'dropoffLocation', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Calculate price estimate when both locations are selected or service type changes
    if ((formData.pickupLocation && formData.dropoffLocation) || formData.serviceType === 'land-tour') {
      calculatePriceEstimate()
    }
  }

  const calculatePriceEstimate = async () => {
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      const price = formData.serviceType === 'airport-transfer' ? 2500 : 5500
      const duration = formData.serviceType === 'airport-transfer' ? 45 : 480 // 8 hours for land tour
      
      setFormData(prev => ({
        ...prev,
        estimatedPrice: price,
        estimatedDuration: duration
      }))
      setIsLoading(false)
    }, 1000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // This would call the booking API
      console.log('Booking data:', formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Redirect to payment or confirmation
      alert('Booking submitted! (This would redirect to payment)')
    } catch (error) {
      console.error('Booking error:', error)
      alert('Booking failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    if (step < 4) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  return (
    <div className="max-w-2xl mx-auto mt-4 lg:mt-8">
      <Card className="bg-zinc-800 border-zinc-700 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Book Your Van</CardTitle>
          <div className="flex justify-center space-x-2 mt-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`w-3 h-3 rounded-full transition-colors ${
                  step >= stepNumber ? 'bg-primary' : 'bg-zinc-600'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-track-zinc-700 scrollbar-thumb-zinc-500">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Service & Route Selection */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    Choose Service Type
                  </h3>
                  
                  {/* Service Type Selection */}
                  <div className="space-y-4 mb-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.serviceType === 'airport-transfer' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-zinc-600 hover:border-zinc-500'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, serviceType: 'airport-transfer' }))}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold">Airport Transfer</h4>
                        </div>
                        <p className="text-sm text-white/70 mb-2">Point-to-point transport to/from Sayak Airport</p>
                        <div className="text-lg font-bold text-primary">₱2,500</div>
                        <div className="text-xs text-white/60">~45 minutes</div>
                      </div>
                      
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.serviceType === 'land-tour' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-zinc-600 hover:border-zinc-500'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, serviceType: 'land-tour' }))}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Map className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold">Land Tour</h4>
                        </div>
                        <p className="text-sm text-white/70 mb-2">Full-day tour around Siargao's top attractions</p>
                        <div className="text-lg font-bold text-primary">₱5,500</div>
                        <div className="text-xs text-white/60">~8 hours</div>
                      </div>
                    </div>
                  </div>

                  <h4 className="text-md font-medium mb-4">
                    {formData.serviceType === 'airport-transfer' ? 'Select Your Route' : 'Choose Tour Destinations'}
                  </h4>
                  
                  {/* Route Selection - Airport Transfer */}
                  {formData.serviceType === 'airport-transfer' && (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="pickup">Pickup Location</Label>
                          <Select
                            value={formData.pickupLocation}
                            onValueChange={(value) => handleLocationChange('pickupLocation', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select pickup location" />
                            </SelectTrigger>
                            <SelectContent>
                              {airportTransferLocations.map((location) => (
                                <SelectItem key={location.value} value={location.value}>
                                  {location.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="dropoff">Dropoff Location</Label>
                          <Select
                            value={formData.dropoffLocation}
                            onValueChange={(value) => handleLocationChange('dropoffLocation', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select dropoff location" />
                            </SelectTrigger>
                            <SelectContent>
                              {airportTransferLocations.map((location) => (
                                <SelectItem key={location.value} value={location.value}>
                                  {location.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Land Tour Selection */}
                  {formData.serviceType === 'land-tour' && (
                    <div className="space-y-4">
                      <div>
                        <Label>Starting Point</Label>
                        <Select
                          value={formData.pickupLocation}
                          onValueChange={(value) => handleLocationChange('pickupLocation', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select starting location" />
                          </SelectTrigger>
                          <SelectContent>
                            {airportTransferLocations.filter(loc => loc.category === 'accommodation').map((location) => (
                              <SelectItem key={location.value} value={location.value}>
                                {location.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Tour Destinations (We'll create the best route)</Label>
                        <div className="grid md:grid-cols-2 gap-3 mt-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-zinc-700 scrollbar-thumb-zinc-500 pr-2">
                          {landTourDestinations.map((destination) => (
                            <div
                              key={destination.value}
                              className="flex items-center space-x-2 p-3 border border-zinc-600 rounded cursor-pointer hover:bg-zinc-700 transition-colors"
                              onClick={() => {
                                const isSelected = formData.landTourStops.includes(destination.value)
                                setFormData(prev => ({
                                  ...prev,
                                  landTourStops: isSelected 
                                    ? prev.landTourStops.filter(stop => stop !== destination.value)
                                    : [...prev.landTourStops, destination.value]
                                }))
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={formData.landTourStops.includes(destination.value)}
                                onChange={() => {}}
                                className="rounded"
                              />
                              <span className="text-sm">{destination.label}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-white/60 mt-2">
                          Select 3-5 destinations for the best experience. We'll optimize the route and timing.
                        </p>
                      </div>
                    </div>
                  )}

                  {formData.pickupLocation === 'custom' && (
                    <div>
                      <Label htmlFor="customPickup">Custom Pickup Address</Label>
                      <Input
                        id="customPickup"
                        value={formData.customPickup}
                        onChange={(e) => setFormData(prev => ({ ...prev, customPickup: e.target.value }))}
                        placeholder="Enter specific pickup address"
                      />
                    </div>
                  )}

                  {formData.dropoffLocation === 'custom' && (
                    <div>
                      <Label htmlFor="customDropoff">Custom Dropoff Address</Label>
                      <Input
                        id="customDropoff"
                        value={formData.customDropoff}
                        onChange={(e) => setFormData(prev => ({ ...prev, customDropoff: e.target.value }))}
                        placeholder="Enter specific dropoff address"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="pickupInstructions">Pickup Instructions (Optional)</Label>
                    <Textarea
                      id="pickupInstructions"
                      value={formData.pickupInstructions}
                      onChange={(e) => setFormData(prev => ({ ...prev, pickupInstructions: e.target.value }))}
                      placeholder="Any specific instructions for pickup (e.g., terminal number, landmark)"
                      rows={3}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    calculatePriceEstimate()
                    nextStep()
                  }}
                  className="w-full"
                  disabled={
                    formData.serviceType === 'airport-transfer' 
                      ? (!formData.pickupLocation || !formData.dropoffLocation)
                      : (!formData.pickupLocation || formData.landTourStops.length === 0)
                  }
                >
                  Continue to Date & Time
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {/* Step 2: Date & Time */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Select Date & Time
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="date">Travel Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <Label htmlFor="time">Preferred Time</Label>
                    <Select
                      value={formData.time}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, time: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="passengers">Number of Passengers</Label>
                      <Select
                        value={formData.passengerCount.toString()}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, passengerCount: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'passenger' : 'passengers'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="luggage">Luggage Count</Label>
                      <Select
                        value={formData.luggageCount.toString()}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, luggageCount: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'bag' : 'bags'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="flex-1"
                    disabled={!formData.date || !formData.time}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Contact Information */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Contact Information
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                  <Textarea
                    id="specialRequests"
                    value={formData.specialRequests}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                    placeholder="Any special requests or requirements"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="flex-1"
                    disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.phone}
                  >
                    Review Booking
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Review & Confirm */}
            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold mb-4">Review Your Booking</h3>

                <div className="space-y-4">
                  <Card className="bg-zinc-700 border-zinc-600">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Service Details</h4>
                      <p className="capitalize">{formData.serviceType.replace('-', ' ')}</p>
                      {formData.serviceType === 'airport-transfer' ? (
                        <p>{formData.pickupLocation} → {formData.dropoffLocation}</p>
                      ) : (
                        <div>
                          <p>Starting from: {formData.pickupLocation}</p>
                          <p>Destinations: {formData.landTourStops.join(', ')}</p>
                        </div>
                      )}
                      {formData.pickupInstructions && (
                        <p className="text-sm text-white/70 mt-1">
                          Instructions: {formData.pickupInstructions}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-700 border-zinc-600">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Travel Details</h4>
                      <p>Date: {formData.date}</p>
                      <p>Time: {formData.time}</p>
                      <p>Passengers: {formData.passengerCount}</p>
                      <p>Luggage: {formData.luggageCount} bags</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-700 border-zinc-600">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Contact Information</h4>
                      <p>{formData.firstName} {formData.lastName}</p>
                      <p>{formData.email}</p>
                      <p>{formData.phone}</p>
                    </CardContent>
                  </Card>

                  {formData.estimatedPrice > 0 && (
                    <Card className="bg-primary/10 border-primary/30">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">Total Price</span>
                          <span className="text-2xl font-bold text-primary">₱{formData.estimatedPrice}</span>
                        </div>
                        <p className="text-sm text-white/70 mt-1">
                          Estimated duration: {formData.serviceType === 'airport-transfer' 
                            ? `${formData.estimatedDuration} minutes` 
                            : `${Math.floor(formData.estimatedDuration / 60)} hours`}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm Booking'
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}