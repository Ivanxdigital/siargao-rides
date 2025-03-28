"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X, LogOut, User, ChevronDown, Settings } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/Button"

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()

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

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen)
  }

  const handleLogout = async () => {
    await logout()
    setIsProfileMenuOpen(false)
  }

  const closeMenus = () => {
    setIsMenuOpen(false)
    setIsProfileMenuOpen(false)
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
          
          {isAuthenticated ? (
            <div className="relative">
              <button
                className="flex items-center gap-2 p-2 rounded-full hover:bg-white/10 transition-colors"
                onClick={toggleProfileMenu}
              >
                <span className="text-sm font-medium text-white">
                  {user?.first_name || user?.email}
                </span>
                <ChevronDown size={16} className="text-white/70" />
              </button>
              
              {/* Profile Menu Dropdown */}
              {isProfileMenuOpen && (
                <motion.div 
                  className="absolute right-0 mt-2 w-56 bg-card border border-border shadow-lg rounded-md overflow-hidden z-50"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-2 border-b border-border bg-card/70">
                    <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <Link href="/dashboard" className="flex items-center gap-2 w-full p-2 text-sm hover:bg-primary/10 rounded-md transition-colors" onClick={closeMenus}>
                      <User size={16} />
                      Dashboard
                    </Link>
                    <Link href="/profile" className="flex items-center gap-2 w-full p-2 text-sm hover:bg-primary/10 rounded-md transition-colors" onClick={closeMenus}>
                      <Settings size={16} />
                      Profile Settings
                    </Link>
                    <button
                      className="flex items-center gap-2 w-full p-2 text-sm hover:bg-destructive/10 text-destructive rounded-md transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 hover:text-white">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/80">
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </div>
          )}
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
            
            {isAuthenticated ? (
              <>
                <div className="h-px w-full bg-white/10 my-2"></div>
                <MobileNavLink href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                  Dashboard
                </MobileNavLink>
                <MobileNavLink href="/profile" onClick={() => setIsMenuOpen(false)}>
                  Profile Settings
                </MobileNavLink>
                <button
                  className="flex items-center py-3 px-2 text-white hover:text-destructive rounded-md transition-colors"
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                >
                  <LogOut size={18} className="mr-2" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <div className="h-px w-full bg-white/10 my-2"></div>
                <div className="flex flex-col gap-2">
                  <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white w-full">
                    <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                  </Button>
                  <Button asChild className="bg-primary hover:bg-primary/80 w-full">
                    <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
                  </Button>
                </div>
              </>
            )}
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