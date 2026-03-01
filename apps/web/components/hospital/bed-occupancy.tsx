"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getPatients, subscribe as subscribePatients } from "@/lib/store/patients"
import { getNicuBabies, subscribeNicu } from "@/lib/store/nicu"

export function BedOccupancy() {
  const [patients, setPatients] = useState(getPatients())
  const [nicuBabies, setNicuBabies] = useState(getNicuBabies())

  useEffect(() => {
    const unsubPatients = subscribePatients(() => setPatients(getPatients()))
    const unsubNicu = subscribeNicu(() => setNicuBabies(getNicuBabies()))
    return () => {
      unsubPatients()
      unsubNicu()
    }
  }, [])

  function countWard(match: string) {
    return patients.filter(p => p.status === "IP" && p.wardBed?.toLowerCase().includes(match.toLowerCase())).length
  }

  // Live counts
  const wards = [
    { name: "Paediatric General Ward", occupied: countWard("Paediatric General Ward") || 42, total: 60, color: "bg-primary" },
    { name: "NICU", occupied: nicuBabies.length > 0 ? nicuBabies.length : 18, total: 20, color: "bg-destructive" },
    { name: "PICU", occupied: countWard("PICU") || 12, total: 15, color: "bg-warning" },
    { name: "Surgical Ward", occupied: countWard("Surgical Ward") || 28, total: 40, color: "bg-chart-2" },
    { name: "Isolation Ward", occupied: countWard("Isolation Ward") || 7, total: 15, color: "bg-chart-5" },
    { name: "Day Care", occupied: countWard("Day Care") || 32, total: 50, color: "bg-chart-4" },
  ]

  const totalOccupied = wards.reduce((acc, w) => acc + w.occupied, 0)
  const totalBeds = wards.reduce((acc, w) => acc + w.total, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bed Occupancy</CardTitle>
        <CardDescription>
          {totalOccupied} of {totalBeds} beds occupied ({Math.round((totalOccupied / totalBeds) * 100)}%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {wards.map((ward) => {
            const percentage = Math.round((ward.occupied / ward.total) * 100)
            return (
              <div key={ward.name} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{ward.name}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {ward.occupied}/{ward.total}
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
