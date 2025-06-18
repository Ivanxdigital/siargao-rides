"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { MapPin, Calendar, Clock, Users, Luggage, MessageSquare, ArrowRight, Loader2 } from "lucide-react"
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
    // Route Information
    pickupLocation: '',
    dropoffLocation: '',
    customPickup: '',
    customDropoff: '',
    pickupInstructions: '',
    
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

  const popularLocations = [
    { value: 'sayak-airport', label: 'Sayak Airport' },
    { value: 'general-luna', label: 'General Luna' },
    { value: 'cloud-9', label: 'Cloud 9' },
    { value: 'pacifico', label: 'Pacifico' },
    { value: 'dapa', label: 'Dapa' },
    { value: 'burgos', label: 'Burgos' },
    { value: 'custom', label: 'Custom Address' }
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

    // Calculate price estimate when both locations are selected
    if (formData.pickupLocation && formData.dropoffLocation) {
      // This would typically call an API to get actual pricing
      calculatePriceEstimate()
    }
  }

  const calculatePriceEstimate = async () => {
    // Fixed price of ₱2,500 for all van hire services
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        estimatedPrice: 2500,
        estimatedDuration: 45
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
    <div className="max-w-2xl mx-auto">
      <Card className="bg-zinc-800 border-zinc-700">
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
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Route Selection */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Select Your Route
                  </h3>
                  
                  {/* Route Selection */}
                  <div className="space-y-4">
                    <Label>Select Your Route</Label>
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
                            {popularLocations.map((location) => (
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
                            {popularLocations.map((location) => (
                              <SelectItem key={location.value} value={location.value}>
                                {location.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

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
                </div>

                <Button
                  type="button"
                  onClick={nextStep}
                  className="w-full"
                  disabled={!formData.pickupLocation || !formData.dropoffLocation}
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
                      <h4 className="font-semibold mb-2">Route Details</h4>
                      <p>{formData.pickupLocation} → {formData.dropoffLocation}</p>
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
                          Estimated duration: {formData.estimatedDuration} minutes
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