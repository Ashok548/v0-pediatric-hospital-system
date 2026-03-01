import { LucideIcon, User, Brush, Clock, Hammer } from "lucide-react"

// Inline SVG check icon to avoid lucide type mismatch
export function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}

export interface StatusConfigEntry {
    label: string
    color: string
    bg: string
    border: string
    icon: LucideIcon
}

// Cast CheckIcon to LucideIcon since it matches the same call signature
export const bedStatusConfig: Record<string, StatusConfigEntry> = {
    "AVAILABLE": { label: "Available", color: "text-success", bg: "bg-success/10", border: "border-success/30", icon: CheckIcon as unknown as LucideIcon },
    "OCCUPIED": { label: "Occupied", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", icon: User },
    "CLEANING": { label: "Cleaning", color: "text-yellow-600 dark:text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: Brush },
    "RESERVED": { label: "Reserved", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: Clock },
    "MAINTENANCE": { label: "Maintenance", color: "text-muted-foreground", bg: "bg-muted", border: "border-border", icon: Hammer },
}

/** Status transitions allowed from each status (for the overflow action menu) */
export const allowedTransitions: Record<string, string[]> = {
    "AVAILABLE": ["RESERVED", "MAINTENANCE"],
    "CLEANING": ["AVAILABLE", "MAINTENANCE"],
    "MAINTENANCE": ["AVAILABLE"],
    "RESERVED": ["AVAILABLE"],
}
