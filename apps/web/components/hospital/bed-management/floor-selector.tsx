"use client"

import { cn } from "@/lib/utils"
import type { ApiFloorWithWards } from "@/lib/types/admission"
import { Building2 } from "lucide-react"

interface FloorSelectorProps {
    floors: ApiFloorWithWards[]
    activeFloorId: string
    onSelectFloor: (id: string) => void
}

export function FloorSelector({ floors, activeFloorId, onSelectFloor }: FloorSelectorProps) {
    return (
        <div className="flex w-full items-center gap-2 overflow-x-auto pb-2 border-b">
            {floors.map((floor) => {
                const allBeds = floor.wards.flatMap(w => w.beds)
                const availableCount = allBeds.filter(b => b.status === "AVAILABLE").length
                const isActive = activeFloorId === floor.id

                return (
                    <button
                        key={floor.id}
                        onClick={() => onSelectFloor(floor.id)}
                        className={cn(
                            "relative flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50",
                            isActive
                                ? "text-primary bg-primary/5"
                                : "text-muted-foreground"
                        )}
                    >
                        <Building2 className="h-4 w-4" />
                        <span>{floor.name}</span>
                        {/* Fix #6: Live available bed count badge on each floor tab */}
                        <span className={cn(
                            "ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                            availableCount === 0
                                ? "bg-red-100 text-red-700"
                                : "bg-emerald-100 text-emerald-700"
                        )}>
                            {availableCount} avail
                        </span>
                        {isActive && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                )
            })}
        </div>
    )
}
