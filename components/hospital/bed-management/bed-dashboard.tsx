"use client"

import { useState, useEffect } from "react"
import { subscribeBeds, getWards } from "@/lib/store/bed-store"
import { WardSelector } from "./ward-selector"
import { OccupancySummary } from "./occupancy-summary"
import { BedGrid } from "./bed-grid"

export function BedDashboard() {
    const [wards, setWards] = useState(getWards())
    const [activeWardId, setActiveWardId] = useState(wards[0]?.id)

    useEffect(() => {
        // Keep internal ward state synced with global bed-store
        setWards(getWards())
        const unsub = subscribeBeds(() => {
            setWards(getWards())
        })
        return unsub
    }, [])

    const activeWard = wards.find((w) => w.id === activeWardId) || wards[0]

    if (!activeWard) return null

    return (
        <div className="flex flex-col gap-6 w-full">
            <WardSelector
                wards={wards}
                activeWardId={activeWardId}
                onSelectWard={setActiveWardId}
            />
            <OccupancySummary ward={activeWard} />
            <BedGrid ward={activeWard} wards={wards} />
        </div>
    )
}
