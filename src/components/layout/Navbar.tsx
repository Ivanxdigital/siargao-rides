"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { Menu, X, LogOut, User, ChevronDown, Settings, ShieldCheck, Home, Search, Clipboard, MessageSquare, ArrowRight, Calendar } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/Button"

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const { user, isAuthenticated, signOut, isAdmin } = useAuth()
  const scrollPosition = useRef(0)

  // Change navbar style on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])
  
  // Better scroll lock implementation
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    
    if (isMenuOpen) {
      // Store current scroll position
      scrollPosition.current = window.scrollY
      
      // Apply fixed position and prevent scrolling
      body.style.position = 'fixed'
      body.style.top = `-${scrollPosition.current}px`
      body.style.left = '0'
      body.style.right = '0'
      body.style.bottom = '0'
      html.style.overflow = 'hidden'
      body.style.overflow = 'hidden'
    } else {
      // Restore scrolling and position
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      body.style.bottom = ''
      html.style.overflow = ''
      body.style.overflow = ''
      
      // Restore scroll position
      if (scrollPosition.current > 0) {
        window.scrollTo(0, scrollPosition.current)
      }
    }
  }, [isMenuOpen])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen)
  }

  const handleLogout = async () => {
    await signOut()
    setIsProfileMenuOpen(false)
  }

  const closeMenus = () => {
    setIsMenuOpen(false)
    setIsProfileMenuOpen(false)
  }

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-[999] transition-all duration-500 ${
          scrolled 
            ? "py-3 bg-transparent backdrop-blur-md shadow-md border-b border-white/10" 
            : "py-5 bg-transparent"
        } ${isMenuOpen ? 'bg-black/90 backdrop-blur-md border-b border-white/10' : ''}`}
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
                    {user?.user_metadata?.first_name || user?.email}
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
                      <p className="text-sm font-medium">{user?.user_metadata?.first_name} {user?.user_metadata?.last_name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 w-full p-2 text-sm hover:bg-primary/10 rounded-md transition-colors"
                        onClick={closeMenus}
                      >
                        <User className="h-4 w-4" />
                        Dashboard
                      </Link>
                      
                      <Link
                        href="/my-bookings"
                        className="flex items-center gap-2 w-full p-2 text-sm hover:bg-primary/10 rounded-md transition-colors"
                        onClick={closeMenus}
                      >
                        <Calendar className="h-4 w-4" />
                        My Bookings
                      </Link>
                      
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 w-full p-2 text-sm hover:bg-primary/10 rounded-md transition-colors"
                          onClick={closeMenus}
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}
                      
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 w-full p-2 text-sm hover:bg-primary/10 rounded-md transition-colors"
                        onClick={closeMenus}
                      >
                        <Settings className="h-4 w-4" />
                        Account Settings
                      </Link>
                      
                      <button
                        className="flex items-center gap-2 w-full p-2 text-sm hover:bg-red-50 text-red-600 hover:text-red-700 rounded-md transition-colors"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
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
            className="md:hidden text-white p-2 rounded-full hover:bg-white/10 transition-colors z-[1000] relative"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            whileTap={{ scale: 0.9 }}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>
        </div>
      </nav>

      {/* Mobile Menu - Separate from the main nav */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[998] bg-black/90 backdrop-blur-md pt-20">
          <div className="pb-8 px-6 overflow-y-auto max-h-screen">
            <div className="space-y-3 mb-6">
              <MobileNavLink href="/" onClick={() => setIsMenuOpen(false)} icon={<Home size={16} />}>
                Home
              </MobileNavLink>
              <MobileNavLink href="/browse" onClick={() => setIsMenuOpen(false)} icon={<Search size={16} />}>
                Browse
              </MobileNavLink>
              <MobileNavLink href="/register" onClick={() => setIsMenuOpen(false)} icon={<Clipboard size={16} />}>
                Register Your Shop
              </MobileNavLink>
              <MobileNavLink href="/contact" onClick={() => setIsMenuOpen(false)} icon={<MessageSquare size={16} />}>
                Contact
              </MobileNavLink>
            </div>
            
            {isAuthenticated ? (
              <>
                <div className="h-px w-full bg-white/10 my-6"></div>
                <div className="space-y-3">
                  <MobileNavLink href="/dashboard" onClick={() => setIsMenuOpen(false)} icon={<User size={16} />}>
                    Dashboard
                  </MobileNavLink>
                  
                  <MobileNavLink href="/my-bookings" onClick={() => setIsMenuOpen(false)} icon={<Calendar size={16} />}>
                    My Bookings
                  </MobileNavLink>
                  
                  {isAdmin && (
                    <MobileNavLink href="/admin" onClick={() => setIsMenuOpen(false)} icon={<ShieldCheck size={16} />}>
                      Admin Panel
                    </MobileNavLink>
                  )}
                  
                  <MobileNavLink href="/profile" onClick={() => setIsMenuOpen(false)} icon={<Settings size={16} />}>
                    Profile Settings
                  </MobileNavLink>
                  
                  <button
                    className="flex items-center w-full py-3 px-3 text-white hover:text-destructive rounded-md transition-colors mt-2 text-sm"
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                  >
                    <LogOut size={16} className="mr-2.5" />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="h-px w-full bg-white/10 my-6"></div>
                <div className="flex flex-col gap-3 mt-2">
                  <Button asChild variant="outline" className="py-3 px-4 border-white/20 text-white hover:bg-white/10 hover:text-white w-full text-sm">
                    <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                  </Button>
                  <Button asChild className="py-3 px-4 bg-primary hover:bg-primary/80 w-full text-sm">
                    <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
                  </Button>
                </div>
              </>
            )}
            
            {/* Menu Footer */}
            <div className="mt-auto pt-6">
              <div className="h-px w-full bg-white/10 mb-4"></div>
              <div className="flex justify-between items-center">
                <div className="text-xs text-white/50">© {new Date().getFullYear()} Siargao Rides</div>
                <div className="flex gap-4">
                  <a href="#" className="text-white/50 hover:text-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-white/50 hover:text-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-white/50 hover:text-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
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
const MobileNavLink = ({ 
  href, 
  onClick, 
  children,
  icon
}: { 
  href: string, 
  onClick: () => void, 
  children: React.ReactNode,
  icon?: React.ReactNode 
}) => {
  return (
    <Link 
      href={href} 
      className="flex items-center py-3 px-4 text-white text-sm font-medium hover:bg-white/5 rounded-md transition-colors group"
      onClick={onClick}
    >
      <div className="flex items-center">
        {icon && <span className="mr-4 text-white/70 group-hover:text-primary transition-colors">{icon}</span>}
        <span>{children}</span>
      </div>
    </Link>
  )
}

export default Navbar 