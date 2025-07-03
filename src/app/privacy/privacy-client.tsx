"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ChevronLeft, Shield } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PrivacyClient() {
  const router = useRouter()

  const handleGoBack = (e: React.MouseEvent) => {
    e.preventDefault()
    // Go back to previous page if available, otherwise go to homepage
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <motion.div
      className="min-h-screen pt-20 bg-gradient-to-b from-black to-gray-900 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors bg-transparent border-none cursor-pointer p-0"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Go Back
            </button>
          </div>

          <motion.div
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 md:p-10 hover:border-primary/50 transition-all duration-300 shadow-lg"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
                  Privacy Policy
                </h1>
                <span className="text-sm text-gray-400">Effective: April 2, 2025</span>
              </div>

              <div className="prose prose-invert max-w-none prose-headings:text-primary prose-a:text-primary prose-a:no-underline hover:prose-a:text-primary/80 prose-hr:border-gray-700">
                <div className="flex items-center gap-3 mb-6 bg-primary/10 p-4 rounded-lg">
                  <Shield className="text-primary h-8 w-8" />
                  <p className="text-lg m-0">
                    We respect your privacy. Here's how we handle your information:
                  </p>
                </div>

                <hr className="my-8" />

                <h2 className="text-xl font-semibold group flex items-center">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md mr-3 text-sm">1</span>
                  Information We Collect
                </h2>
                <ul>
                  <li>Account details (name, email, phone number)</li>
                  <li>Booking information</li>
                  <li>Messages sent through the platform</li>
                  <li>Analytics data to improve our service</li>
                </ul>

                <hr className="my-8" />

                <h2 className="text-xl font-semibold group flex items-center">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md mr-3 text-sm">2</span>
                  How We Use Your Data
                </h2>
                <ul>
                  <li>To allow you to book with rental providers</li>
                  <li>To communicate with you about your bookings</li>
                  <li>To improve and secure our platform</li>
                  <li>To promote offers or updates (with your consent)</li>
                </ul>

                <hr className="my-8" />

                <h2 className="text-xl font-semibold group flex items-center">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md mr-3 text-sm">3</span>
                  Data Sharing
                </h2>
                <p>
                  We only share your information with:
                </p>
                <ul>
                  <li>The rental shop you've booked with</li>
                  <li>Service providers that help us run this platform (like payment gateways)</li>
                </ul>
                <p className="bg-gray-900/50 border-l-4 border-primary/50 pl-4 py-2 italic">
                  We <strong>never sell</strong> your personal data.
                </p>

                <hr className="my-8" />

                <h2 className="text-xl font-semibold group flex items-center">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md mr-3 text-sm">4</span>
                  Your Choices
                </h2>
                <ul>
                  <li>You can update your information anytime in your account.</li>
                  <li>You can delete your account by contacting us.</li>
                  <li>You can opt-out of marketing emails anytime.</li>
                </ul>

                <hr className="my-8" />

                <h2 className="text-xl font-semibold group flex items-center">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md mr-3 text-sm">5</span>
                  Security
                </h2>
                <p>
                  We use secure technology to protect your data, but no system is 100% immune. Use the platform wisely and protect your own account.
                </p>

                <hr className="my-8" />

                <h2 className="text-xl font-semibold group flex items-center">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md mr-3 text-sm">6</span>
                  Questions?
                </h2>
                <p>
                  Reach us at <Link href="mailto:support@siargaorides.com" className="text-primary hover:underline">support@siargaorides.com</Link>.
                </p>

                <div className="mt-8 p-4 bg-gray-900/70 rounded-lg border border-gray-700">
                  <p className="text-center m-0">
                    Thank you for trusting Siargao Rides. We're here to help you explore Siargao, one ride at a time.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <div className="text-center mt-8 text-sm text-gray-400">
            <div className="flex justify-center gap-4">
              <Link href="/terms" className="text-primary hover:text-primary/80">Terms of Service</Link>
              <span className="text-gray-600">•</span>
              <Link href="/contact" className="text-primary hover:text-primary/80">Contact Us</Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}