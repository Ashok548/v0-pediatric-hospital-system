import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const wards = [
  { name: "General Pediatrics", occupied: 42, total: 60, color: "bg-primary" },
  { name: "NICU", occupied: 18, total: 20, color: "bg-destructive" },
  { name: "PICU", occupied: 12, total: 15, color: "bg-warning" },
  { name: "Surgical Ward", occupied: 28, total: 40, color: "bg-chart-2" },
  { name: "Isolation Ward", occupied: 7, total: 15, color: "bg-chart-5" },
  { name: "Day Care", occupied: 32, total: 50, color: "bg-chart-4" },
]

export function BedOccupancy() {
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
