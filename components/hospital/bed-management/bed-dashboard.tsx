"use client"

import { useState, useEffect } from "react"
import { subscribeBeds, getFloors } from "@/lib/store/bed-store"
import { FloorSelector } from "./floor-selector"
import { FloorSummary } from "./floor-summary"
import { WardList } from "./ward-list"
import { BedGrid } from "./bed-grid"

export function BedDashboard() {
    const [floors, setFloors] = useState(getFloors())
    const [activeFloorId, setActiveFloorId] = useState(floors[0]?.id)
    const [activeWardId, setActiveWardId] = useState<string | undefined>(floors[0]?.wards[0]?.id)

    useEffect(() => {
        // Keep internal state synced with global observer
        setFloors(getFloors())
        const unsub = subscribeBeds(() => {
            setFloors(getFloors())
        })
        return unsub
    }, [])

    const activeFloor = floors.find((f) => f.id === activeFloorId) || floors[0]

    // Fix #11: Only trigger on floor change, not on every activeWardId change
    useEffect(() => {
        if (activeFloor) {
            const wardExistsInFloor = activeFloor.wards.some(w => w.id === activeWardId)
            if (!wardExistsInFloor && activeFloor.wards.length > 0) {
                setActiveWardId(activeFloor.wards[0].id)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFloor])

    const activeWard = activeFloor?.wards.find((w) => w.id === activeWardId) || activeFloor?.wards[0]

    if (!activeFloor || !activeWard) return null

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Top Level: Switch Floors */}
            <FloorSelector
                floors={floors}
                activeFloorId={activeFloor.id}
                onSelectFloor={setActiveFloorId}
            />

            {/* Aggregated KPI for the active floor */}
            <FloorSummary floor={activeFloor} />

            {/* Split View: Ward Selection + Bed Grid */}
            {/* Fix #4: Single WardList instance — visible on md+ as left column, collapsible on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">
                <div className="md:col-span-1 md:border-r md:pr-4">
                    <WardList
                        wards={activeFloor.wards}
                        activeWardId={activeWard.id}
                        onSelectWard={setActiveWardId}
                    />
                </div>

                <div className="md:col-span-3 lg:col-span-4 pl-0 md:pl-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold tracking-tight">{activeWard.name}</h2>
                        <span className="text-sm text-muted-foreground bg-muted px-2.5 py-1 rounded-md font-medium">
                            {activeWard.beds.length} Beds
                        </span>
                    </div>
                    {/* The BedGrid needs to know about full layout for modals later */}
                    <BedGrid floor={activeFloor} ward={activeWard} floors={floors} />
                </div>
            </div>
        </div>
    )
}
