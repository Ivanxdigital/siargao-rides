"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { motion } from "framer-motion"

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Change navbar style on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <>
      {/* Add a spacer div to prevent content from being hidden under fixed navbar */}
      <div className="h-16 md:h-20"></div>
      
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? "py-3 bg-background/90 backdrop-blur-lg shadow-md" 
            : "py-4 bg-background"
        }`}
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-primary">
            Siargao Rides
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-8 items-center">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/browse">Browse</NavLink>
            <NavLink href="/register">Register Your Shop</NavLink>
            <NavLink href="/contact">Contact</NavLink>
          </div>

          {/* Mobile Menu Button */}
          <motion.button 
            className="md:hidden text-foreground p-2 rounded-full hover:bg-accent transition-colors" 
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            whileTap={{ scale: 0.9 }}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div 
            className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-lg border-b border-border"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <MobileNavLink href="/" onClick={() => setIsMenuOpen(false)}>
                Home
              </MobileNavLink>
              <MobileNavLink href="/browse" onClick={() => setIsMenuOpen(false)}>
                Browse
              </MobileNavLink>
              <MobileNavLink href="/register" onClick={() => setIsMenuOpen(false)}>
                Register Your Shop
              </MobileNavLink>
              <MobileNavLink href="/contact" onClick={() => setIsMenuOpen(false)}>
                Contact
              </MobileNavLink>
            </div>
          </motion.div>
        )}
      </nav>
    </>
  )
}

// NavLink component for desktop
const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) => {
  return (
    <Link href={href} className="relative group">
      <span className="text-foreground/80 hover:text-primary transition-colors py-2 font-medium">
        {children}
      </span>
      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
    </Link>
  )
}

// MobileNavLink component
const MobileNavLink = ({ href, onClick, children }: { href: string, onClick: () => void, children: React.ReactNode }) => {
  return (
    <Link 
      href={href} 
      className="flex items-center py-3 px-2 text-foreground/80 hover:text-primary transition-colors border-b border-border/30 hover:bg-accent/20 rounded-md"
      onClick={onClick}
    >
      {children}
    </Link>
  )
}

export default Navbar 