import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

const patients = [
  {
    id: "P-1847",
    name: "Arjun Gupta",
    age: "4 yrs",
    ward: "NICU",
    status: "Critical",
    doctor: "Dr. Sharma",
    admitted: "Feb 20, 2026",
    initials: "AG",
  },
  {
    id: "P-1846",
    name: "Meera Iyer",
    age: "7 yrs",
    ward: "General",
    status: "Stable",
    doctor: "Dr. Reddy",
    admitted: "Feb 19, 2026",
    initials: "MI",
  },
  {
    id: "P-1845",
    name: "Rohan Patel",
    age: "2 yrs",
    ward: "PICU",
    status: "Recovering",
    doctor: "Dr. Khan",
    admitted: "Feb 18, 2026",
    initials: "RP",
  },
  {
    id: "P-1844",
    name: "Ananya Das",
    age: "10 yrs",
    ward: "Surgical",
    status: "Stable",
    doctor: "Dr. Joshi",
    admitted: "Feb 18, 2026",
    initials: "AD",
  },
  {
    id: "P-1843",
    name: "Kabir Singh",
    age: "6 mos",
    ward: "NICU",
    status: "Critical",
    doctor: "Dr. Sharma",
    admitted: "Feb 17, 2026",
    initials: "KS",
  },
]

function getStatusVariant(status: string) {
  switch (status) {
    case "Critical":
      return "destructive" as const
    case "Stable":
      return "secondary" as const
    case "Recovering":
      return "outline" as const
    default:
      return "secondary" as const
  }
}

export function RecentPatients() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Admissions</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" className="text-xs text-primary">
            View all
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {patients.map((patient, index) => (
            <div
              key={patient.id}
              className="flex items-center justify-between py-3 border-b border-border last:border-0 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-medium">
                    {patient.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {patient.name}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">{patient.age}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {patient.id} &middot; {patient.doctor}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
                  {patient.ward}
                </Badge>
                <Badge variant={getStatusVariant(patient.status)} className="text-[10px]">
                  {patient.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
