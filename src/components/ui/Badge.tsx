import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "text-foreground border border-border",
        available: "bg-tropical-green text-background",
        unavailable: "bg-destructive text-destructive-foreground",
        verified: "bg-tropical-teal text-background",
        rating: "bg-tropical-yellow text-background",
        pending: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 backdrop-blur-sm shadow-[0_0_15px_rgba(234,179,8,0.2)] animate-pulse-subtle",
        motorcycle: "bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm",
        car: "bg-blue-500/20 text-blue-400 border border-blue-500/30 backdrop-blur-sm",
        tuktuk: "bg-amber-500/20 text-amber-400 border border-amber-500/30 backdrop-blur-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }