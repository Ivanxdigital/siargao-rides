import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add formatCurrency function to format numbers as Philippine Peso
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Convert text with line breaks (\n) to React elements with proper line breaks
export function formatTextWithLineBreaks(text: string): React.ReactElement {
  if (!text) {
    return React.createElement('span', {}, '');
  }

  // Split text by line breaks and filter out empty strings from multiple consecutive \n
  const lines = text.split('\n');
  
  // Create React elements for each line
  const elements: React.ReactNode[] = [];
  
  lines.forEach((line, index) => {
    // Add the text content (even if empty for spacing)
    elements.push(line);
    
    // Add line break except for the last line
    if (index < lines.length - 1) {
      elements.push(React.createElement('br', { key: `br-${index}` }));
    }
  });

  return React.createElement('span', {}, ...elements);
}
