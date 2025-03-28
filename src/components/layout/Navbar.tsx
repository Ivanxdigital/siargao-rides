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
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? "py-3 bg-transparent backdrop-blur-md shadow-md border-b border-white/10" 
          : "py-5 bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="relative group">
          <span className="text-xl font-bold text-white transition-colors duration-300">
            Siargao Rides
          </span>
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-tropical-teal group-hover:w-full transition-all duration-300" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 items-center">
          <NavLink href="/" isScrolled={scrolled}>Home</NavLink>
          <NavLink href="/browse" isScrolled={scrolled}>Browse</NavLink>
          <NavLink href="/register" isScrolled={scrolled}>Register Your Shop</NavLink>
          <NavLink href="/contact" isScrolled={scrolled}>Contact</NavLink>
        </div>

        {/* Mobile Menu Button */}
        <motion.button 
          className="md:hidden text-white p-2 rounded-full hover:bg-white/10 transition-colors"
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
          className="md:hidden absolute top-full left-0 right-0 bg-transparent backdrop-blur-md border-b border-white/10"
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
  )
}

// NavLink component for desktop
const NavLink = ({ href, children, isScrolled }: { href: string, children: React.ReactNode, isScrolled: boolean }) => {
  return (
    <Link href={href} className="relative group">
      <span className="text-white hover:text-white transition-colors py-2 font-medium">
        {children}
      </span>
      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-tropical-teal group-hover:w-full transition-all duration-300" />
    </Link>
  )
}

// MobileNavLink component
const MobileNavLink = ({ href, onClick, children }: { href: string, onClick: () => void, children: React.ReactNode }) => {
  return (
    <Link 
      href={href} 
      className="flex items-center py-3 px-2 text-white hover:text-white hover:bg-white/10 transition-colors rounded-md"
      onClick={onClick}
    >
      {children}
    </Link>
  )
}

export default Navbar 