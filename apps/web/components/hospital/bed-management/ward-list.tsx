"use client"

import { useEffect, useRef } from "react"
import type { ApiWardWithBeds } from "@/lib/types/admission"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface WardListProps {
    wards: ApiWardWithBeds[]
    activeWardId: string | undefined
    onSelectWard: (id: string) => void
}

export function WardList({ wards, activeWardId, onSelectWard }: WardListProps) {
    const activeRef = useRef<HTMLButtonElement | null>(null)

    // Fix #9 — Scroll active ward into view when selection changes (needed on mobile)
    useEffect(() => {
        activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }, [activeWardId])

    return (
        <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-sm mb-1">Select Ward</h3>
            {wards.map((ward) => {
                const isActive = activeWardId === ward.id
                const occupiedCount = ward.beds.filter(b => b.status === "OCCUPIED").length
                // Fix #1 — Use live bed count, not static totalBeds
                const occupancyRate = ward.beds.length > 0 ? (occupiedCount / ward.beds.length) * 100 : 0

                return (
                    <button
                        key={ward.id}
                        ref={isActive ? activeRef : null}
                        onClick={() => onSelectWard(ward.id)}
                        className="text-left w-full transition-all hover:scale-[1.01]"
                    >
                        <Card className={cn(
                            "border transition-colors",
                            isActive
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "hover:border-primary/50"
                        )}>
                            <CardContent className="p-3">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="font-semibold text-sm">{ward.name}</div>
                                    <span className={cn(
                                        "text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded",
                                        ward.type === "NICU" ? "bg-purple-100 text-purple-700" :
                                            ward.type === "PICU" ? "bg-amber-100 text-amber-700" :
                                                ward.type === "SURGICAL" ? "bg-red-100 text-red-700" :
                                                    ward.type === "PRIVATE" ? "bg-indigo-100 text-indigo-700" :
                                                        "bg-blue-100 text-blue-700"
                                    )}>
                                        {ward.type}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end text-xs text-muted-foreground mt-3">
                                    <span>{occupiedCount} / {ward.beds.length} Occupied</span>
                                    <span className={cn(
                                        "font-medium",
                                        occupancyRate > 90 ? "text-red-600" :
                                            occupancyRate > 75 ? "text-amber-600" : "text-emerald-600"
                                    )}>
                                        {Math.round(occupancyRate)}% full
                                    </span>
                                </div>
                                <div className="mt-1.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-500",
                                            occupancyRate > 90 ? "bg-red-500" :
                                                occupancyRate > 75 ? "bg-amber-500" : "bg-emerald-500"
                                        )}
                                        style={{ width: `${occupancyRate}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </button>
                )
            })}
        </div>
    )
}
