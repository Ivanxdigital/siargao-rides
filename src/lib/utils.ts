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

// Format price helper (alias for formatCurrency for compatibility)
export function formatPrice(amount: number): string {
  return formatCurrency(amount);
}

// Vehicle Group utility functions
export function formatGroupAvailability(available: number, total: number): string {
  if (available === 0) {
    return 'No units available'
  } else if (available === total) {
    return 'All units available'
  } else if (available === 1) {
    return '1 unit available'
  } else {
    return `${available} of ${total} units available`
  }
}

export function getAvailabilityColor(available: number, total: number): string {
  const percentage = total > 0 ? (available / total) * 100 : 0
  
  if (percentage === 0) return 'red'
  if (percentage <= 20) return 'orange'
  if (percentage <= 50) return 'yellow'
  return 'green'
}

export function formatUnitIdentifier(
  pattern: string, 
  index: number, 
  vehicleName: string
): string {
  return pattern
    .replace('{index}', index.toString())
    .replace('{name}', vehicleName)
}

export function parseGroupNamingPattern(pattern: string): {
  hasIndex: boolean
  hasName: boolean
  example: string
} {
  const hasIndex = pattern.includes('{index}')
  const hasName = pattern.includes('{name}')
  const example = pattern
    .replace('{index}', '1')
    .replace('{name}', 'Honda Click')
  
  return { hasIndex, hasName, example }
}
