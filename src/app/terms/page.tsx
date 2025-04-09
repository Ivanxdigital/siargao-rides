"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ExternalLink, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TermsOfServicePage() {
  const router = useRouter();

  const handleGoBack = (e: React.MouseEvent) => {
    e.preventDefault();
    // Go back to previous page if available, otherwise go to homepage
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

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
                  Terms of Service
                </h1>
                <span className="text-sm text-gray-400">Effective: April 2, 2025</span>
              </div>

              <div className="prose prose-invert max-w-none prose-headings:text-primary prose-a:text-primary prose-a:no-underline hover:prose-a:text-primary/80 prose-hr:border-gray-700">
                <p className="text-lg">
                  Welcome to Siargao Rides! We're a platform that connects tourists and travelers with local motorbike rental shops across Siargao. By using our website, you agree to the following terms:
                </p>

                <hr className="my-8" />

                <h2 className="text-xl font-semibold group flex items-center">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md mr-3 text-sm">1</span>
                  What We Do
                </h2>
                <p>
                  Siargao Rides is a directory and booking platform. We showcase listings from local motorbike rental providers. We help users discover, compare, and book motorbikes directly from those providers.
                </p>
                <p className="bg-gray-900/50 border-l-4 border-primary/50 pl-4 py-2 italic">
                  <strong>Important:</strong> We do <strong>not</strong> own, rent out, or manage any motorbikes. We're simply the connection point.
                </p>

                <hr className="my-8" />

                <h2 className="text-xl font-semibold group flex items-center">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md mr-3 text-sm">2</span>
                  Your Responsibility as a User
                </h2>
                <p>
                  When you book a motorbike through our site, you are entering a direct agreement with the local rental shop — not with Siargao Rides. You agree that:
                </p>
                <ul>
                  <li>You are responsible for your own safety while using a motorbike.</li>
                  <li>You are responsible for understanding and following local laws.</li>
                  <li>You will deal directly with the rental shop regarding any deposits, insurance, or damages.</li>
                </ul>

                <hr className="my-8" />

                <h2 className="text-xl font-semibold group flex items-center">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md mr-3 text-sm">3</span>
                  Rental Shops' Responsibility
                </h2>
                <p>
                  All shops listed on our platform are independent businesses. They are responsible for:
                </p>
                <ul>
                  <li>Ensuring their motorbikes are roadworthy and insured.</li>
                  <li>Handling ID deposits and security checks.</li>
                  <li>Managing disputes, damages, or any issues that arise with the customer.</li>
                </ul>

                <hr className="my-8" />

                <h2 className="text-xl font-semibold group flex items-center">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md mr-3 text-sm">4</span>
                  Our Liability
                </h2>
                <p>
                  To keep things clear:
                </p>
                <ul>
                  <li>We are <strong>not</strong> responsible for any accidents, injuries, damages, theft, or losses.</li>
                  <li>We do <strong>not</strong> mediate disputes between users and rental providers.</li>
                  <li>You agree to use our platform <strong>at your own risk</strong>.</li>
                </ul>

                <hr className="my-8" />

                <h2 className="text-xl font-semibold group flex items-center">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md mr-3 text-sm">5</span>
                  Booking and Payment
                </h2>
                <p>
                  We may facilitate payments or bookings between users and rental shops. Any fees paid are for platform use or convenience. The rental agreement and liability rest between the user and the provider.
                </p>

                <hr className="my-8" />

                <h2 className="text-xl font-semibold group flex items-center">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md mr-3 text-sm">6</span>
                  Changes and Termination
                </h2>
                <p>
                  We may update these Terms anytime. If we do, we'll post the changes here. If you keep using the site after that, it means you accept the updated terms.
                </p>
              </div>
            </motion.div>
          </motion.div>

          <div className="text-center mt-8 text-sm text-gray-400">
            <p>
              Have questions about our Terms? <Link href="/contact" className="text-primary hover:text-primary/80">Contact Us</Link>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}