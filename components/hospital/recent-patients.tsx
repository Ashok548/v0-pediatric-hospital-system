import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const patients = [
  {
    id: "P-1847",
    name: "Arjun Gupta",
    age: "4 yrs",
    gender: "M",
    ward: "NICU",
    bed: "N-12",
    status: "Critical",
    diagnosis: "Neonatal Sepsis",
    doctor: "Dr. Sharma",
    admitted: "Feb 20, 2026",
    initials: "AG",
  },
  {
    id: "P-1846",
    name: "Meera Iyer",
    age: "7 yrs",
    gender: "F",
    ward: "General",
    bed: "G-24",
    status: "Stable",
    diagnosis: "Acute Bronchitis",
    doctor: "Dr. Reddy",
    admitted: "Feb 19, 2026",
    initials: "MI",
  },
  {
    id: "P-1845",
    name: "Rohan Patel",
    age: "2 yrs",
    gender: "M",
    ward: "PICU",
    bed: "P-05",
    status: "Recovering",
    diagnosis: "Febrile Seizure",
    doctor: "Dr. Khan",
    admitted: "Feb 18, 2026",
    initials: "RP",
  },
  {
    id: "P-1844",
    name: "Ananya Das",
    age: "10 yrs",
    gender: "F",
    ward: "Surgical",
    bed: "S-18",
    status: "Stable",
    diagnosis: "Appendectomy (Post-Op)",
    doctor: "Dr. Joshi",
    admitted: "Feb 18, 2026",
    initials: "AD",
  },
  {
    id: "P-1843",
    name: "Kabir Singh",
    age: "6 mos",
    gender: "M",
    ward: "NICU",
    bed: "N-08",
    status: "Critical",
    diagnosis: "Congenital Heart Defect",
    doctor: "Dr. Sharma",
    admitted: "Feb 17, 2026",
    initials: "KS",
  },
  {
    id: "P-1842",
    name: "Priya Nambiar",
    age: "5 yrs",
    gender: "F",
    ward: "General",
    bed: "G-31",
    status: "Stable",
    diagnosis: "Viral Gastroenteritis",
    doctor: "Dr. Gupta",
    admitted: "Feb 17, 2026",
    initials: "PN",
  },
]

function getStatusClasses(status: string) {
  switch (status) {
    case "Critical":
      return "bg-destructive/10 text-destructive border-destructive/20"
    case "Stable":
      return "bg-success/10 text-success border-success/20"
    case "Recovering":
      return "bg-primary/10 text-primary border-primary/20"
    default:
      return "bg-secondary text-secondary-foreground border-border"
  }
}

export function RecentPatients() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Admissions</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" className="text-xs text-primary">
            View all patients
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-medium text-muted-foreground px-6 pb-3 whitespace-nowrap">
                  Patient
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 pb-3 whitespace-nowrap hidden md:table-cell">
                  Diagnosis
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 pb-3 whitespace-nowrap hidden lg:table-cell">
                  Ward / Bed
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 pb-3 whitespace-nowrap hidden sm:table-cell">
                  Doctor
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 pb-3 whitespace-nowrap hidden xl:table-cell">
                  Admitted
                </th>
                <th className="text-right font-medium text-muted-foreground px-6 pb-3 whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr
                  key={patient.id}
                  className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-[11px] font-medium">
                          {patient.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-foreground truncate">
                          {patient.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {patient.id} &middot; {patient.age} &middot; {patient.gender}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 hidden md:table-cell">
                    <span className="text-sm text-foreground">{patient.diagnosis}</span>
                  </td>
                  <td className="px-3 py-3.5 hidden lg:table-cell">
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">{patient.ward}</span>
                      <span className="text-xs text-muted-foreground">Bed {patient.bed}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 hidden sm:table-cell">
                    <span className="text-sm text-muted-foreground">{patient.doctor}</span>
                  </td>
                  <td className="px-3 py-3.5 hidden xl:table-cell">
                    <span className="text-sm text-muted-foreground">{patient.admitted}</span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-semibold border",
                        getStatusClasses(patient.status)
                      )}
                    >
                      {patient.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
