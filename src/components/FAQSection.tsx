"use client"

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FAQItemProps {
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void
}

const faqData = [
  {
    question: "Do I need a driver's license to rent a motorbike?",
    answer: "Yes, a valid driver's license is required. For foreigners, an International Driving Permit (IDP) along with your home country's license is recommended. Some shops might accept your home license, but it's best to check with them directly."
  },
  {
    question: "Is a helmet included with the rental?",
    answer: "Most rental shops provide helmets (usually one or two) with the motorbike rental. It's always best to confirm when booking and ensure the helmet fits properly. Safety first!"
  },
  {
    question: "What type of motorbike should I choose?",
    answer: "Scooters (automatic) are great for beginners and cruising around town. Semi-automatics offer a bit more control. Dirt bikes or manual bikes are better suited for more experienced riders or exploring off-the-beaten-path areas. Consider your experience and where you plan to go."
  },
  {
    question: "What happens if the motorbike breaks down?",
    answer: "Rental shops usually have procedures for breakdowns. Contact the shop immediately. They typically provide assistance or a replacement vehicle, depending on the situation and their policy. Ask about their breakdown policy before renting."
  },
  {
    question: "Can I rent for multiple days or weeks?",
    answer: "Absolutely! Most shops offer daily, weekly, and sometimes even monthly rental rates. Longer rentals often come with discounted daily rates."
  },
  {
    question: "Are the roads safe in Siargao?",
    answer: "While main roads are generally paved, conditions can vary, especially after rain. Be aware of potholes, animals on the road, and local driving habits. Always ride defensively and within your comfort level. Refer to our Safety Tips section for more!"
  }
]

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        className={cn(
          "flex justify-between items-center w-full py-4 sm:py-5 px-4 sm:px-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors duration-200 ease-in-out",
          isOpen ? "bg-white/5" : "hover:bg-white/5"
        )}
        onClick={onClick}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${question.replace(/\s+/g, '-')}`}
      >
        <span className="text-base font-medium text-white">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300 ease-in-out" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-in-out" />
        )}
      </button>
      <div 
        id={`faq-answer-${question.replace(/\s+/g, '-')}`}
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-1">
          <p className="text-sm text-gray-300 leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  )
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const handleClick = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-10 sm:py-16 md:py-20 bg-gradient-to-b from-gray-900 to-black text-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16 opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-2 sm:mb-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
              Frequently Asked Questions
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
            Got questions? We've got answers. Find quick info about renting in Siargao.
          </p>
        </div>

        {/* Accordion Container */}
        <div className="max-w-4xl mx-auto bg-gray-900/40 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg overflow-hidden">
          {faqData.map((item, index) => (
            <FAQItem
              key={index}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === index}
              onClick={() => handleClick(index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
} 