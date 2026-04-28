import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatusCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: string
    isPositive: boolean
  }
  variant?: "default" | "success" | "warning" | "danger"
  className?: string
}

export function StatusCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  variant = "default",
  className 
}: StatusCardProps) {
  const variantStyles = {
    default: "border-border/50 bg-card",
    success: "border-primary/30 bg-primary/5",
    warning: "border-secondary/30 bg-secondary/5", 
    danger: "border-destructive/30 bg-destructive/5"
  }

  const iconStyles = {
    default: "text-primary bg-primary/10",
    success: "text-primary bg-primary/20",
    warning: "text-secondary bg-secondary/20",
    danger: "text-destructive bg-destructive/20"
  }

  return (
    <Card className={cn(
      "card-gradient hover-lift transition-all duration-300",
      variantStyles[variant],
      className
    )}>
      <CardContent className="p-6 pointer-events-auto">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight break-all">
                {value}
              </h3>
              {trend && (
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap",
                  trend.isPositive 
                    ? "bg-primary/20 text-primary" 
                    : "bg-destructive/20 text-destructive"
                )}>
                  {trend.isPositive ? "+" : ""}{trend.value}
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-2">
                {description}
              </p>
            )}
          </div>
          
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-lg",
            iconStyles[variant]
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}