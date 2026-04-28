import { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface MinimalCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: string
    isPositive: boolean
  }
  variant?: "default" | "accent"
  className?: string
  onClick?: () => void
}

export function MinimalCard({ title, value, description, icon: Icon, trend, variant = "default" }: MinimalCardProps) {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
      className="minimal-card p-3 sm:p-4 group"
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        {trend && (
          <span className={cn(
            "text-xs font-medium",
            trend.isPositive ? "text-primary" : "text-red-400"
          )}>
            {trend.isPositive ? "+" : ""}{trend.value}
          </span>
        )}
      </div>
      
      <div className="space-y-0.5 sm:space-y-1">
        <p className="text-lg sm:text-xl md:text-2xl font-black text-foreground">{value}</p>
        <p className="text-xs sm:text-sm text-muted-foreground truncate">{title}</p>
      </div>
    </motion.div>
  )
}