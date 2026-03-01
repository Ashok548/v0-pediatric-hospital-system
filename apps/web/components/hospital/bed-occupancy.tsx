"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useBedHierarchy } from "@/lib/api/admissions"
import { Skeleton } from "@/components/ui/skeleton"

export function BedOccupancy() {
  const { floors, isLoading } = useBedHierarchy()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bed Occupancy</CardTitle>
          <CardDescription>Loading occupancy data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    )
  }

  const allWards = floors?.flatMap(f => f.wards) || []

  // Totals for the whole hospital
  const totalBeds = allWards.reduce((acc, w) => acc + w.beds.length, 0)
  const totalOccupied = allWards.reduce((acc, w) => acc + w.beds.filter(b => b.status === "OCCUPIED").length, 0)

  // Map to the required stats structure and sort by size to show top 6
  const wardStats = allWards.map(w => {
    const occupied = w.beds.filter(b => b.status === "OCCUPIED").length
    const total = w.beds.length
    let colorClass = "bg-primary"
    if (w.type === "NICU") colorClass = "bg-destructive"
    else if (w.type === "PICU") colorClass = "bg-yellow-500"
    else if (w.type === "SURGICAL") colorClass = "bg-chart-2"
    else if (w.type === "PRIVATE") colorClass = "bg-chart-5"

    return { name: w.name, occupied, total, colorClass }
  }).sort((a, b) => b.total - a.total).slice(0, 6)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bed Occupancy</CardTitle>
        <CardDescription>
          {totalOccupied} of {totalBeds} beds occupied {totalBeds > 0 ? `(${Math.round((totalOccupied / totalBeds) * 100)}%)` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {wardStats.map((ward) => {
            const percentage = ward.total > 0 ? Math.round((ward.occupied / ward.total) * 100) : 0
            return (
              <div key={ward.name} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium truncate pr-4">{ward.name}</span>
                  <span className="text-muted-foreground tabular-nums shrink-0">
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
