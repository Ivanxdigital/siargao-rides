"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FAQItemProps {
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void
  index: number
}

const faqData = [
  {
    question: "Do I need a driver's license to rent a motorbike in Siargao?",
    answer: "Yes, a valid driver's license is required for all vehicle rentals in Siargao. For foreigners, an International Driving Permit (IDP) along with your home country's license is recommended. Some Siargao rental shops might accept your home license, but it's best to check with them directly."
  },
  {
    question: "What are the typical motorbike rental prices in Siargao?",
    answer: "Motorbike rental prices in Siargao typically range from ₱300-800 per day depending on the type of vehicle. Scooters are usually ₱300-500/day, while manual motorcycles and larger bikes can cost ₱500-800/day. Weekly and monthly rentals often offer better rates."
  },
  {
    question: "Where can I pick up my rental vehicle in Siargao?",
    answer: "Most rental shops offer pickup in General Luna, Cloud 9, and around the airport area. Many shops provide flexible pickup locations including your accommodation. Some may charge a small delivery fee for locations outside their main service area."
  },
  {
    question: "Is a helmet included with motorbike rentals in Siargao?",
    answer: "Most Siargao rental shops provide helmets (usually one or two) with the motorbike rental. It's always best to confirm when booking and ensure the helmet fits properly. Safety first on Siargao's roads!"
  },
  {
    question: "What type of vehicle should I rent for exploring Siargao?",
    answer: "For Siargao exploration: Scooters (automatic) are perfect for General Luna, Cloud 9, and paved roads. Semi-automatics offer more power for hills and longer distances. Manual motorcycles are ideal for experienced riders wanting to explore remote beaches and off-road spots like Magpupungko Rock Pools."
  },
  {
    question: "Can I rent a car or just motorbikes in Siargao?",
    answer: "You can rent both! While motorbikes are most popular in Siargao, many shops also offer cars, vans, and multicabs for families or groups. Cars are great for airport transfers and comfortable island touring, especially during rainy season."
  },
  {
    question: "What happens if my rental breaks down in Siargao?",
    answer: "Siargao rental shops usually have breakdown procedures. Contact your rental shop immediately - they typically provide roadside assistance or a replacement vehicle. Ask about their breakdown policy and emergency contact numbers before renting."
  },
  {
    question: "How far in advance should I book a vehicle rental in Siargao?",
    answer: "During peak season (December-March), book 1-2 weeks in advance. For surfing season and holidays, even earlier booking is recommended. During off-season, you can often find availability with just a few days notice, but popular vehicle types may still sell out."
  },
  {
    question: "Are Siargao roads safe for tourists?",
    answer: "Siargao's main roads between General Luna, Cloud 9, and the airport are generally well-maintained. However, conditions can vary, especially after rain. Watch for potholes, animals, and local traffic patterns. Many tourists successfully explore the island - just ride defensively and within your comfort level."
  },
  {
    question: "Can I rent vehicles for multiple days or weeks in Siargao?",
    answer: "Absolutely! Most Siargao rental shops offer daily, weekly, and monthly rates. Extended rentals typically come with significant discounts - weekly rates can be 20-30% cheaper per day, and monthly rentals offer even better value for longer stays."
  }
]

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, onClick, index }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="mb-4 last:mb-0"
    >
      <div 
        className={cn(
          "bg-white/[0.03] backdrop-blur-sm rounded-xl overflow-hidden",
          "border border-white/[0.05] shadow-sm transition-all duration-300",
          isOpen ? "shadow-lg" : "hover:border-white/10 hover:bg-white/[0.05]"
        )}
      >
        <button
          className="flex justify-between items-center w-full py-5 px-6 text-left focus:outline-none group"
          onClick={onClick}
          aria-expanded={isOpen}
          aria-controls={`faq-answer-${question.replace(/\s+/g, '-')}`}
        >
          <span className="font-medium text-white text-base md:text-lg pr-2">{question}</span>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
            "transition-all duration-300 ease-out",
            isOpen 
              ? "bg-primary text-black rotate-0" 
              : "bg-white/10 text-white group-hover:bg-white/20"
          )}>
            {isOpen ? (
              <Minus className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </div>
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key={`answer-${index}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ 
                height: { duration: 0.3, ease: "easeInOut" },
                opacity: { duration: 0.2, ease: "easeInOut" }
              }}
            >
              <div className="px-6 pb-5 pt-0">
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  <p className="text-gray-300 leading-relaxed text-sm md:text-base">{answer}</p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const handleClick = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-semibold mb-3 md:mb-4 relative inline-block">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-primary bg-size-200 animate-gradient">
              Frequently Asked Questions
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
            Got questions? We've got answers. Find quick info about renting in Siargao.
          </p>
        </motion.div>

        {/* Accordion Container */}
        <div className="relative">
          {/* Decorative elements */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl opacity-20"></div>
          
          {/* FAQ items */}
          <div className="relative">
            {faqData.map((item, index) => (
              <FAQItem
                key={index}
                index={index}
                question={item.question}
                answer={item.answer}
                isOpen={openIndex === index}
                onClick={() => handleClick(index)}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Add some global styles for the animations */}
      <style jsx global>{`
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradientFlow 3s ease infinite;
        }
        .bg-size-200 {
          background-size: 200% auto;
        }
      `}</style>
    </section>
  )
} 