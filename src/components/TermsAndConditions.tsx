"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog"
import { motion } from "framer-motion"

interface TermsAndConditionsProps {
  children: React.ReactNode
}

export function TermsAndConditions({ children }: TermsAndConditionsProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 text-center sm:text-left">
            Terms and Conditions – Siargao Rides
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 prose prose-invert prose-sm sm:prose max-w-none">
          <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
            By using Siargao Rides to book motorbike rentals, you agree to the following terms and conditions:
          </p>
          
          <div className="space-y-4 sm:space-y-6">
            <motion.div 
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border-l-4 border-primary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <h3 className="text-lg font-medium mb-2 text-white flex items-center">
                <span className="bg-primary/20 text-primary text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full mr-2">1</span>
                Platform Role
              </h3>
              <p className="text-white/80 text-sm leading-relaxed">
                Siargao Rides is a <strong className="text-primary/90">third-party booking platform</strong> that connects users (you) with independent local motorbike rental providers in Siargao. We <strong className="text-primary/90">do not own, operate, or control</strong> any of the vehicles listed on this website.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border-l-4 border-primary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <h3 className="text-lg font-medium mb-2 text-white flex items-center">
                <span className="bg-primary/20 text-primary text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full mr-2">2</span>
                Responsibility and Liability
              </h3>
              <ul className="text-white/80 text-sm leading-relaxed space-y-2 list-disc pl-5">
                <li>Siargao Rides is <strong className="text-primary/90">not liable</strong> for any accidents, injuries, damages, losses, or deaths that may occur before, during, or after your motorbike rental.</li>
                <li>All <strong className="text-primary/90">rental agreements</strong>, <strong className="text-primary/90">payments</strong>, and <strong className="text-primary/90">responsibilities</strong> are between <strong className="text-primary/90">you</strong> and the <strong className="text-primary/90">rental provider</strong>.</li>
                <li>You agree that you are <strong className="text-primary/90">renting and operating the motorbike at your own risk</strong>.</li>
              </ul>
            </motion.div>
            
            <motion.div 
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border-l-4 border-primary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <h3 className="text-lg font-medium mb-2 text-white flex items-center">
                <span className="bg-primary/20 text-primary text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full mr-2">3</span>
                User Responsibility
              </h3>
              <ul className="text-white/80 text-sm leading-relaxed space-y-2 list-disc pl-5">
                <li>You must ensure that you have a <strong className="text-primary/90">valid driver's license</strong> and are <strong className="text-primary/90">physically and legally fit</strong> to operate a motorbike.</li>
                <li>You are responsible for complying with <strong className="text-primary/90">local laws</strong>, <strong className="text-primary/90">safety regulations</strong>, and <strong className="text-primary/90">the rental provider's terms</strong>.</li>
                <li>You accept full responsibility for the <strong className="text-primary/90">use and condition</strong> of the motorbike during the rental period.</li>
              </ul>
            </motion.div>
            
            <motion.div 
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border-l-4 border-primary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <h3 className="text-lg font-medium mb-2 text-white flex items-center">
                <span className="bg-primary/20 text-primary text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full mr-2">4</span>
                Disputes and Claims
              </h3>
              <ul className="text-white/80 text-sm leading-relaxed space-y-2 list-disc pl-5">
                <li>Any disputes, complaints, or claims related to the vehicle, its condition, or the service provided must be handled <strong className="text-primary/90">directly with the rental provider</strong>.</li>
                <li>Siargao Rides does not mediate disputes and is not liable for refunds, cancellations, or damages.</li>
              </ul>
            </motion.div>
            
            <motion.div 
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border-l-4 border-primary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <h3 className="text-lg font-medium mb-2 text-white flex items-center">
                <span className="bg-primary/20 text-primary text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full mr-2">5</span>
                Changes and Cancellations
              </h3>
              <p className="text-white/80 text-sm leading-relaxed">
                Each rental provider sets their <strong className="text-primary/90">own policies</strong> regarding cancellations, refunds, and rescheduling. Please review these details before booking.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border-l-4 border-primary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <h3 className="text-lg font-medium mb-2 text-white flex items-center">
                <span className="bg-primary/20 text-primary text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full mr-2">6</span>
                Agreement
              </h3>
              <p className="text-white/80 text-sm leading-relaxed">
                By using our platform, you acknowledge that you have read, understood, and agreed to these terms and conditions. If you do not agree, please do not use the Siargao Rides website or services.
              </p>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 