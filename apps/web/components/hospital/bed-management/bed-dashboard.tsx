"use client"

import { useState, useEffect } from "react"
import { useBedHierarchy, useAdmissions } from "@/lib/api/admissions"
import type { ApiFloorWithWards, ApiWardWithBeds, ApiAdmission } from "@/lib/types/admission"
import { Skeleton } from "@/components/ui/skeleton"
import { FloorSelector } from "./floor-selector"
import { FloorSummary } from "./floor-summary"
import { WardList } from "./ward-list"
import { BedGrid } from "./bed-grid"

export function BedDashboard() {
    const { floors, isLoading: bedsLoading } = useBedHierarchy()
    // Fetch active admissions to build bed→patient lookup map.
    // Using a high limit to cover all active admissions; the proper long-term
    // fix is a backend endpoint that embeds the current patient in the hierarchy.
    const { admissions, isLoading: admissionsLoading } = useAdmissions({ status: "ADMITTED", limit: 1000 })

    const [activeFloorId, setActiveFloorId] = useState<string | undefined>()
    const [activeWardId, setActiveWardId] = useState<string | undefined>()

    // Set initial selections when floors load
    useEffect(() => {
        if (floors.length > 0 && !activeFloorId) {
            setActiveFloorId(floors[0].id)
            if (floors[0].wards.length > 0) {
                setActiveWardId(floors[0].wards[0].id)
            }
        }
    }, [floors, activeFloorId])

    const activeFloor = floors.find((f: ApiFloorWithWards) => f.id === activeFloorId) || floors[0]

    // Fix #11: Only trigger on floor change, not on every activeWardId change
    useEffect(() => {
        if (activeFloor) {
            const wardExistsInFloor = activeFloor.wards.some((w: ApiWardWithBeds) => w.id === activeWardId)
            if (!wardExistsInFloor && activeFloor.wards.length > 0) {
                setActiveWardId(activeFloor.wards[0].id)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFloor])

    const activeWard = activeFloor?.wards.find((w: ApiWardWithBeds) => w.id === activeWardId) || activeFloor?.wards[0]

    if (bedsLoading || admissionsLoading) {
        return (
            <div className="flex flex-col gap-6 w-full animate-pulse">
                <Skeleton className="h-12 w-full rounded-lg" />
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 w-full">
                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    <div className="md:col-span-1 md:border-r md:pr-4">
                        <Skeleton className="h-[400px] w-full" />
                    </div>
                    <div className="md:col-span-3 lg:col-span-4 pl-0 md:pl-2">
                        <Skeleton className="h-8 w-48 mb-4" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-[220px] w-full" />)}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!activeFloor || !activeWard) {
        return <div className="p-8 text-center text-muted-foreground">No bed layout configured.</div>
    }

    // Build a map of active admissions by bed ID for quick lookup in the grid
    const admissionsMap = new Map<string, ApiAdmission>()
    admissions.forEach((adm: ApiAdmission) => {
        if (adm.currentBedId) {
            admissionsMap.set(adm.currentBedId, adm)
        }
    })

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
                    {/* The BedGrid passes the admissions map to link patients to beds */}
                    <BedGrid floor={activeFloor} ward={activeWard} floors={floors} admissionsMap={admissionsMap} />
                </div>
            </div>
        </div>
    )
}
