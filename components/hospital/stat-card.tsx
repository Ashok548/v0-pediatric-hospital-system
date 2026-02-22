import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  percentage?: number
}

function PercentageRing({ value, color }: { value: number; color: string }) {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative flex items-center justify-center size-12">
      <svg className="size-12 -rotate-90" viewBox="0 0 44 44" aria-hidden="true">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-border"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={color}
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-foreground">{value}%</span>
    </div>
  )
}

export function StatCard({
  title,
  value,
  subtitle,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  percentage,
}: StatCardProps) {
  return (
    <Card className="py-5 hover:shadow-md transition-shadow">
      <CardContent className="flex items-start justify-between">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
          {change && (
            <span
              className={cn(
                "text-xs font-medium",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </span>
          )}
        </div>
        {percentage !== undefined ? (
          <PercentageRing value={percentage} color={iconColor} />
        ) : (
          <div className={cn("flex items-center justify-center size-11 rounded-xl shrink-0", iconBg)}>
            <Icon className={cn("size-5", iconColor)} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
