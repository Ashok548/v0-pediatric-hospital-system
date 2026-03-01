import { Ward } from "@/lib/data/mock-beds"
import { BedDouble, CheckCircle2, User, Sparkles, Clock, Wrench } from "lucide-react"

interface OccupancySummaryProps {
    ward: Ward
}

export function OccupancySummary({ ward }: OccupancySummaryProps) {
    const stats = {
        total: ward.totalBeds,
        occupied: ward.beds.filter(b => b.status === "OCCUPIED").length,
        available: ward.beds.filter(b => b.status === "AVAILABLE").length,
        cleaning: ward.beds.filter(b => b.status === "CLEANING").length,
        reserved: ward.beds.filter(b => b.status === "RESERVED").length,
        maintenance: ward.beds.filter(b => b.status === "MAINTENANCE").length,
    }

    const items = [
        { label: "Total Beds", value: stats.total, icon: BedDouble, colorClass: "text-foreground bg-muted" },
        { label: "Available", value: stats.available, icon: CheckCircle2, colorClass: "text-success bg-success/10" },
        { label: "Occupied", value: stats.occupied, icon: User, colorClass: "text-destructive bg-destructive/10" },
        { label: "Cleaning", value: stats.cleaning, icon: Sparkles, colorClass: "text-yellow-500 bg-yellow-500/10" },
        { label: "Reserved", value: stats.reserved, icon: Clock, colorClass: "text-blue-500 bg-blue-500/10" },
        { label: "Maintenance", value: stats.maintenance, icon: Wrench, colorClass: "text-muted-foreground bg-muted" },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {items.map((item) => (
                <div key={item.label} className="border border-border rounded-xl p-4 flex items-center gap-4 bg-card shadow-sm">
                    <div className={`p-2.5 rounded-lg shrink-0 ${item.colorClass}`}>
                        <item.icon className="size-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-bold leading-none">{item.value}</span>
                        <span className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">{item.label}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}
