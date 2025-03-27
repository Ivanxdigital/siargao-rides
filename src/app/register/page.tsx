"use client"

import { useState } from "react"
import { Upload, Info } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: "",
    shopName: "",
    email: "",
    phone: "",
    governmentId: null as File | null,
    businessPermit: null as File | null
  })
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'governmentId' | 'businessPermit') => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        [field]: e.target.files[0]
      })
    }
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // In a real app, we would validate and send the data to the server
    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
      console.log("Form submitted:", formData)
    }, 1500)
  }
  
  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <div className="bg-card border border-border rounded-lg p-8">
          <h1 className="text-2xl font-bold mb-4">Registration Submitted!</h1>
          <Badge variant="verified" className="mx-auto mb-6">Pending Verification</Badge>
          <p className="text-muted-foreground mb-6">
            Thank you for registering your shop. Your application is now being reviewed.
            We'll contact you via email once the verification process is complete.
          </p>
          <Button asChild>
            <a href="/">Return to Homepage</a>
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-2 text-center">Register Your Shop</h1>
      <p className="text-center text-muted-foreground mb-8">
        Join our platform and start renting your motorbikes to tourists in Siargao
      </p>
      
      <div className="bg-card border border-border rounded-lg p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Owner Information */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Owner Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="shopName" className="block text-sm font-medium mb-1">
                  Shop Name
                </label>
                <input
                  type="text"
                  id="shopName"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Contact Information */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Verification Documents */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Verification Documents</h2>
            
            <div className="bg-muted/30 border border-border rounded-md p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  For security and verification purposes, we require a government-issued ID. 
                  A business permit is recommended but optional. This helps us maintain 
                  a trusted marketplace for our users.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="governmentId" className="block text-sm font-medium mb-1">
                  Government-issued ID (required)
                </label>
                <div className="flex items-center justify-center border border-dashed border-border rounded-md h-32 cursor-pointer relative overflow-hidden bg-background/50">
                  <input
                    type="file"
                    id="governmentId"
                    name="governmentId"
                    onChange={(e) => handleFileChange(e, 'governmentId')}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    accept="image/*,.pdf"
                    required
                  />
                  <div className="text-center">
                    <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload</p>
                    <p className="text-xs text-muted-foreground">Accepted formats: JPG, PNG, PDF</p>
                  </div>
                  
                  {formData.governmentId && (
                    <div className="absolute inset-0 flex items-center justify-center bg-card/90 z-0">
                      <p className="text-sm font-medium">{formData.governmentId.name}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="businessPermit" className="block text-sm font-medium mb-1">
                  Business/Municipal Permit (optional)
                </label>
                <div className="flex items-center justify-center border border-dashed border-border rounded-md h-32 cursor-pointer relative overflow-hidden bg-background/50">
                  <input
                    type="file"
                    id="businessPermit"
                    name="businessPermit"
                    onChange={(e) => handleFileChange(e, 'businessPermit')}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    accept="image/*,.pdf"
                  />
                  <div className="text-center">
                    <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload</p>
                    <p className="text-xs text-muted-foreground">Accepted formats: JPG, PNG, PDF</p>
                  </div>
                  
                  {formData.businessPermit && (
                    <div className="absolute inset-0 flex items-center justify-center bg-card/90 z-0">
                      <p className="text-sm font-medium">{formData.businessPermit.name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Submit Registration"}
          </Button>
        </form>
      </div>
    </div>
  )
} 