"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Mail, MapPin, MessageCircle } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { motion } from "framer-motion"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
      duration: 0.5
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
}

const fadeInVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5
    }
  }
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    // Clear error when user starts typing again
    if (error) setError(null)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }
      
      setIsSubmitted(true)
      setFormData({ name: "", email: "", message: "" })
    } catch (err) {
      console.error('Error submitting form:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <motion.div 
      className="min-h-screen pt-20"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <section className="relative bg-gradient-to-b from-black to-gray-900 text-white overflow-hidden min-h-screen">
        {/* Background with overlay gradient */}
        <motion.div 
          className="absolute inset-0 z-0 opacity-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 1.2 }}
        >
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-900/30"></div>
        </motion.div>
        
        <div className="container mx-auto px-4 py-12 relative z-10">
          <motion.div 
            className="text-center mb-8"
            variants={itemVariants}
          >
            <Badge className="mb-4 text-sm bg-primary/20 text-primary border-primary/30 backdrop-blur-sm">
              Get In Touch
            </Badge>
            <motion.h1 
              className="text-3xl font-bold"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Contact Us
            </motion.h1>
            <motion.p 
              className="text-gray-300 mt-2 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Have questions or feedback? We'd love to hear from you.
            </motion.p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Contact Form */}
            <motion.div 
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              variants={itemVariants}
            >
              {isSubmitted ? (
                <motion.div 
                  className="text-center py-8"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <h2 className="text-xl font-semibold mb-4">Thank You!</h2>
                  <p className="text-gray-300 mb-6">
                    Your message has been sent successfully. We'll get back to you as soon as possible.
                  </p>
                  <Button 
                    onClick={() => setIsSubmitted(false)} 
                    className="bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm"
                  >
                    Send Another Message
                  </Button>
                </motion.div>
              ) : (
                <motion.form 
                  onSubmit={handleSubmit} 
                  className="space-y-4"
                >
                  {error && (
                    <motion.div 
                      className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-md text-sm"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {error}
                    </motion.div>
                  )}
                
                  <motion.div variants={fadeInVariants}>
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
                  </motion.div>
                  
                  <motion.div variants={fadeInVariants}>
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
                  </motion.div>
                  
                  <motion.div variants={fadeInVariants}>
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
                  </motion.div>
                  
                  <motion.div
                    variants={fadeInVariants}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white border border-primary/40 shadow-sm"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </motion.div>
                </motion.form>
              )}
            </motion.div>
            
            {/* Contact Info */}
            <div className="space-y-6">
              <motion.div 
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                variants={itemVariants}
              >
                <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <motion.div 
                    className="flex items-start gap-3"
                    variants={fadeInVariants}
                    whileHover={{ x: 3, transition: { duration: 0.2 } }}
                  >
                    <MapPin size={20} className="text-primary mt-1" />
                    <div>
                      <h3 className="font-medium text-gray-200">Address</h3>
                      <p className="text-gray-300">
                        Tourism Road, General Luna<br />
                        Siargao Island, Surigao del Norte<br />
                        Philippines
                      </p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-start gap-3"
                    variants={fadeInVariants}
                    whileHover={{ x: 3, transition: { duration: 0.2 } }}
                  >
                    <Mail size={20} className="text-primary mt-1" />
                    <div>
                      <h3 className="font-medium text-gray-200">Email</h3>
                      <a 
                        href="mailto:siargaorides@gmail.com" 
                        className="text-gray-300 hover:text-primary transition-colors"
                      >
                        siargaorides@gmail.com
                      </a>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-start gap-3"
                    variants={fadeInVariants}
                    whileHover={{ x: 3, transition: { duration: 0.2 } }}
                  >
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
                  </motion.div>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                variants={itemVariants}
              >
                <h2 className="text-xl font-semibold mb-4">Business Hours</h2>
                <div className="space-y-2 text-gray-300">
                  <motion.div 
                    className="flex justify-between"
                    variants={fadeInVariants}
                  >
                    <span>Monday - Friday:</span>
                    <span>8:00 AM - 6:00 PM</span>
                  </motion.div>
                  <motion.div 
                    className="flex justify-between"
                    variants={fadeInVariants}
                  >
                    <span>Saturday:</span>
                    <span>9:00 AM - 5:00 PM</span>
                  </motion.div>
                  <motion.div 
                    className="flex justify-between"
                    variants={fadeInVariants}
                  >
                    <span>Sunday:</span>
                    <span>10:00 AM - 4:00 PM</span>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  )
} 