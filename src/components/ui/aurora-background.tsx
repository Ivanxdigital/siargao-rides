'use client'

import { cn } from '@/lib/utils'

interface AuroraBackgroundProps {
  className?: string
  children?: React.ReactNode
  showRadialGradient?: boolean
}

export default function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
}: AuroraBackgroundProps) {
  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-80"
          style={{
            background: 'linear-gradient(45deg, #0f172a 0%, #1e293b 20%, #334155 40%, #0f766e 60%, #134e4a 80%, #0f172a 100%)',
            backgroundSize: '400% 400%',
            animation: 'aurora-outer 12s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute inset-0 opacity-60 blur-sm"
          style={{
            background: 'linear-gradient(135deg, transparent 0%, rgba(15, 118, 110, 0.3) 30%, rgba(20, 184, 166, 0.4) 50%, rgba(134, 25, 143, 0.3) 70%, transparent 100%)',
            backgroundSize: '300% 300%',
            animation: 'aurora-inner 8s ease-in-out infinite reverse'
          }}
        />
        <div 
          className="absolute inset-0 opacity-70 blur-md"
          style={{
            background: `radial-gradient(circle at 20% 80%, rgba(15, 118, 110, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(134, 25, 143, 0.3) 0%, transparent 50%)`,
            animation: 'aurora-accent 10s ease-in-out infinite'
          }}
        />
        {showRadialGradient && (
          <div 
            className="absolute inset-0 opacity-90"
            style={{
              background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(20, 184, 166, 0.15) 0%, transparent 60%)'
            }}
          />
        )}
      </div>
      {children}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes aurora-outer {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes aurora-inner {
            0%, 100% { background-position: 0% 0%; }
            50% { background-position: 100% 100%; }
          }
          @keyframes aurora-accent {
            0%, 100% { opacity: 0.7; transform: rotate(0deg) scale(1); }
            33% { opacity: 0.9; transform: rotate(1deg) scale(1.05); }
            66% { opacity: 0.8; transform: rotate(-1deg) scale(0.95); }
          }
          @media (prefers-reduced-motion: reduce) {
            [style*="aurora-"] { animation: none !important; }
          }
        `
      }} />
    </div>
  )
}