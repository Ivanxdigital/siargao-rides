"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

type MobileWhatsAppCtaProps = {
  href: string;
  label: string;
  icon?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  showAfterVh?: number;
  minScrollPx?: number;
};

export function MobileWhatsAppCta({
  href,
  label,
  icon,
  className,
  buttonClassName,
  showAfterVh = 0.7,
  minScrollPx = 280,
}: MobileWhatsAppCtaProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = React.useState(false);
  const visibleRef = React.useRef(false);
  const thresholdRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);

  const updateThreshold = React.useCallback(() => {
    thresholdRef.current = Math.max(minScrollPx, Math.round(window.innerHeight * showAfterVh));
  }, [minScrollPx, showAfterVh]);

  const updateVisibility = React.useCallback(() => {
    const nextVisible = window.scrollY >= thresholdRef.current;

    if (nextVisible !== visibleRef.current) {
      visibleRef.current = nextVisible;
      setIsVisible(nextVisible);
    }
  }, []);

  React.useEffect(() => {
    updateThreshold();
    updateVisibility();

    const onScroll = () => {
      if (rafRef.current !== null) {
        return;
      }

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        updateVisibility();
      });
    };

    const onResize = () => {
      updateThreshold();
      onScroll();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [updateThreshold, updateVisibility]);

  const content = (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center justify-center gap-2 rounded-full bg-emerald-600 py-4 text-sm font-medium text-white shadow-xl shadow-emerald-600/20 transition-transform active:scale-95",
        buttonClassName,
      )}
    >
      {icon}
      {label}
    </a>
  );

  if (shouldReduceMotion) {
    return isVisible ? <div className={className}>{content}</div> : null;
  }

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          className={className}
          initial={{ opacity: 0, y: 16, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.99 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        >
          {content}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
