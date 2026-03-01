import type { ApiFloorWithWards } from "@/lib/types/admission"
import { Card, CardContent } from "@/components/ui/card"
import { BedDouble, UserCheck, Bed, AlertTriangle, Ban, Hammer } from "lucide-react"
import { cn } from "@/lib/utils"

interface FloorSummaryProps {
    floor: ApiFloorWithWards
}

export function FloorSummary({ floor }: FloorSummaryProps) {
    const allBeds = floor.wards.flatMap(w => w.beds)

    const stats = {
        total: allBeds.length,
        occupied: allBeds.filter(b => b.status === "OCCUPIED").length,
        available: allBeds.filter(b => b.status === "AVAILABLE").length,
        cleaning: allBeds.filter(b => b.status === "CLEANING").length,
        reserved: allBeds.filter(b => b.status === "RESERVED").length,
        maintenance: allBeds.filter(b => b.status === "MAINTENANCE").length
    }

    const statCards = [
        { label: "Total Beds", value: stats.total, icon: BedDouble, color: "text-blue-600", bg: "bg-blue-100/50" },
        { label: "Occupied", value: stats.occupied, icon: UserCheck, color: "text-red-600", bg: "bg-red-100/50" },
        { label: "Available", value: stats.available, icon: Bed, color: "text-emerald-600", bg: "bg-emerald-100/50" },
        { label: "Cleaning", value: stats.cleaning, icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-100/50" },
        { label: "Reserved", value: stats.reserved, icon: Ban, color: "text-blue-600", bg: "bg-blue-100/50" },
        { label: "Maintenance", value: stats.maintenance, icon: Hammer, color: "text-gray-600", bg: "bg-gray-100/50" },
    ]

    return (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 w-full">
            {statCards.map((stat, i) => {
                const Icon = stat.icon
                return (
                    <Card key={i} className="border-none shadow-sm md:shadow-md">
                        <CardContent className="p-3 md:p-4 flex items-center gap-3">
                            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", stat.bg)}>
                                <Icon className={cn("h-5 w-5", stat.color)} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xl md:text-2xl font-bold leading-none tracking-tight">{stat.value}</p>
                                <p className="text-[11px] md:text-sm font-medium text-muted-foreground truncate">{stat.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
