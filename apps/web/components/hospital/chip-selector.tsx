"use client"

import { cn } from "@/lib/utils"

interface ChipOption {
  label: string
  value: string
}

interface ChipSelectorProps {
  options: ChipOption[]
  selected: string
  onChange: (value: string) => void
  className?: string
}

export function ChipSelector({ options, selected, onChange, className }: ChipSelectorProps) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {options.map((option) => {
        const isSelected = option.value === selected

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isSelected
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-pressed={isSelected}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}