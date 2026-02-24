"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type FaqAccordionItem = {
  question: string;
  answer: string;
};

type FaqAccordionProps = {
  items: FaqAccordionItem[];
  className?: string;
};

export function FaqAccordion({ items, className }: FaqAccordionProps) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={cn("divide-y divide-slate-100", className)}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const triggerId = `${baseId}-trigger-${index}`;
        const contentId = `${baseId}-content-${index}`;

        return (
          <article key={item.question} className="py-1">
            <h3>
              <button
                id={triggerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={contentId}
                onClick={() =>
                  setOpenIndex((currentIndex) =>
                    currentIndex === index ? null : index
                  )
                }
                className="group flex w-full items-center justify-between gap-4 rounded-lg py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <span className="text-base font-semibold text-slate-900">
                  {item.question}
                </span>
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-all duration-300 ease-out group-hover:border-slate-300 group-hover:text-slate-700",
                    isOpen && "rotate-180 border-slate-300 text-slate-700"
                  )}
                >
                  <ChevronDown className="h-4 w-4" />
                </span>
              </button>
            </h3>

            <div
              id={contentId}
              role="region"
              aria-labelledby={triggerId}
              aria-hidden={!isOpen}
              className={cn(
                "grid overflow-hidden transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <p
                  className={cn(
                    "pb-5 text-sm leading-relaxed text-slate-500 transition-all duration-300 ease-out motion-reduce:transition-none",
                    isOpen ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
                  )}
                >
                  {item.answer}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
