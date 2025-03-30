"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Mail, MapPin, MessageCircle } from "lucide-react"
import { Badge } from "@/components/ui/Badge"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // In a real app, we would send the data to the server
    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
      console.log("Contact form submitted:", formData)
    }, 1000)
  }
  
  return (
    <div className="min-h-screen pt-20">
      <section className="relative bg-gradient-to-b from-black to-gray-900 text-white overflow-hidden min-h-screen">
        {/* Background with overlay gradient */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-900/30"></div>
        </div>
        
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="text-center mb-8">
            <Badge className="mb-4 text-sm bg-primary/20 text-primary border-primary/30 backdrop-blur-sm">
              Get In Touch
            </Badge>
            <h1 className="text-3xl font-bold">Contact Us</h1>
            <p className="text-gray-300 mt-2 max-w-2xl mx-auto">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Contact Form */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              {isSubmitted ? (
                <div className="text-center py-8">
                  <h2 className="text-xl font-semibold mb-4">Thank You!</h2>
                  <p className="text-gray-300 mb-6">
                    Your message has been sent successfully. We'll get back to you as soon as possible.
                  </p>
                  <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm">
                    <a href="/">Return to Homepage</a>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1 text-gray-200">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-200">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-1 text-gray-200">
                      Your Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      className="appearance-none block w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-white"
                      required
                    ></textarea>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              )}
            </div>
            
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-primary mt-1" />
                    <div>
                      <h3 className="font-medium text-gray-200">Address</h3>
                      <p className="text-gray-300">
                        Tourism Road, General Luna<br />
                        Siargao Island, Surigao del Norte<br />
                        Philippines
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Mail size={20} className="text-primary mt-1" />
                    <div>
                      <h3 className="font-medium text-gray-200">Email</h3>
                      <a 
                        href="mailto:info@siargaorides.com" 
                        className="text-gray-300 hover:text-primary transition-colors"
                      >
                        info@siargaorides.com
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MessageCircle size={20} className="text-primary mt-1" />
                    <div>
                      <h3 className="font-medium text-gray-200">WhatsApp</h3>
                      <a 
                        href="https://wa.me/639123456789" 
                        className="text-gray-300 hover:text-primary transition-colors"
                      >
                        +63 912 345 6789
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                <h2 className="text-xl font-semibold mb-4">Business Hours</h2>
                <div className="space-y-2 text-gray-300">
                  <div className="flex justify-between">
                    <span>Monday - Friday:</span>
                    <span>8:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday:</span>
                    <span>9:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday:</span>
                    <span>10:00 AM - 4:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 