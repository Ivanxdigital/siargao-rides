import Link from "next/link"
import { Instagram, Facebook, MessageCircle } from "lucide-react"
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_NUMBER } from "@/lib/whatsapp"

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const whatsappUrl = buildWhatsAppUrl({
    phoneNumber: DEFAULT_WHATSAPP_NUMBER,
    message: "Hi Siargao Rides! I'd like to inquire about private van hire or private tours.",
  })

  return (
    <footer className="bg-background border-t border-border py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Column */}
          <div className="flex flex-col">
            <h3 className="text-xl font-bold text-primary mb-4">Siargao Rides</h3>
            <p className="text-muted-foreground mb-4">
              Premium private van hire and private tours in Siargao. Fast quotes and bookings via WhatsApp.
            </p>
          </div>

          {/* Links Column */}
          <div className="flex flex-col">
            <h4 className="font-semibold text-foreground mb-4">Links</h4>
            <div className="flex flex-col gap-2">
              <Link href="/airport-transfer-siargao" className="text-muted-foreground hover:text-primary transition-colors">
                Airport Transfer
              </Link>
              <Link href="/private-van-hire-siargao" className="text-muted-foreground hover:text-primary transition-colors">
                Private Van Hire
              </Link>
              <Link href="/tours-siargao" className="text-muted-foreground hover:text-primary transition-colors">
                Private Tours
              </Link>
              <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                About Us
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                Terms & Conditions
              </Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                Contact Us
              </Link>
            </div>
          </div>

          {/* Social Column */}
          <div className="flex flex-col">
            <h4 className="font-semibold text-foreground mb-4">Connect With Us</h4>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/siargaorides"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={24} />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61575066621582"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={24} />
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle size={24} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center text-muted-foreground text-sm">
          © {currentYear} Siargao Rides. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer
