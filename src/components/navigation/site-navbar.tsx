"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, MessageCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteNavLinks } from "@/components/navigation/nav-links";

type SiteNavbarProps = {
  whatsappHref: string;
};

function linkIsActive(pathname: string, currentHash: string, href: string): boolean {
  const [pathOnly, hashPart] = href.split("#");
  const normalizedPath = pathOnly || "/";

  if (hashPart) {
    return pathname === normalizedPath && currentHash === `#${hashPart}`;
  }

  if (normalizedPath === "/") {
    return pathname === "/" && !currentHash;
  }

  return pathname === normalizedPath;
}

export function SiteNavbar({ whatsappHref }: SiteNavbarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentHash, setCurrentHash] = React.useState("");

  const clearHashForHome = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (pathname !== "/" || !window.location.hash) {
        return;
      }

      event.preventDefault();
      window.history.pushState({}, "", "/");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setCurrentHash("");
      setIsOpen(false);
    },
    [pathname],
  );

  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const updateHash = () => {
      setCurrentHash(window.location.hash || "");
    };

    updateHash();
    window.addEventListener("hashchange", updateHash);

    return () => {
      window.removeEventListener("hashchange", updateHash);
    };
  }, [pathname]);

  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-6">
        <Link href="/" aria-label="Siargao Rides home">
          <Image
            src="/logo-brand.png"
            alt="Siargao Rides"
            width={4139}
            height={1138}
            priority
            className="h-auto w-[146px] sm:w-[160px]"
          />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {siteNavLinks.map((link) => {
            const isActive = linkIsActive(pathname, currentHash, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                onClick={link.href === "/" ? clearHashForHome : undefined}
                className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            className="hidden rounded-full bg-emerald-600 px-5 text-sm text-white shadow-sm shadow-emerald-600/20 transition-colors hover:bg-emerald-700 sm:inline-flex"
          >
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              Get Quote
            </a>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setIsOpen((prev) => !prev)}
            className="h-10 w-10 rounded-full border-slate-200 bg-white text-slate-800 shadow-sm transition-colors hover:bg-slate-50 lg:hidden"
          >
            {isOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 top-16 z-[55] bg-slate-900/25 backdrop-blur-[1px] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />

            <motion.div
              className="fixed top-20 right-4 left-4 z-[60] rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl shadow-slate-900/10 backdrop-blur-md lg:hidden"
              initial={{ opacity: 0, y: -8, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.99 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="space-y-1">
                {siteNavLinks.map((link, index) => {
                  const isActive = linkIsActive(pathname, currentHash, link.href);

                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, y: -3 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.18,
                        ease: "easeOut",
                        delay: 0.04 + index * 0.03,
                      }}
                    >
                      <Link
                        href={link.href}
                        onClick={
                          link.href === "/"
                            ? clearHashForHome
                            : () => setIsOpen(false)
                        }
                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-slate-900 text-white"
                            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              <motion.div
                className="mt-3 border-t border-slate-100 pt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.12 }}
              >
                <Button
                  asChild
                  className="h-11 w-full rounded-xl bg-emerald-600 text-sm text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700"
                >
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Get Quote on WhatsApp
                  </a>
                </Button>
              </motion.div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </nav>
  );
}
