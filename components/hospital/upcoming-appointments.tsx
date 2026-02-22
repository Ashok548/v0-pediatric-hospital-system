import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"

const appointments = [
  {
    time: "09:00 AM",
    patient: "Diya Nair",
    age: "3 yrs",
    type: "Follow-up",
    doctor: "Dr. Reddy",
    department: "General",
  },
  {
    time: "09:30 AM",
    patient: "Vivaan Jha",
    age: "8 yrs",
    type: "Vaccination",
    doctor: "Dr. Gupta",
    department: "Immunization",
  },
  {
    time: "10:00 AM",
    patient: "Sara Ali",
    age: "5 yrs",
    type: "Consultation",
    doctor: "Dr. Sharma",
    department: "Neurology",
  },
  {
    time: "10:30 AM",
    patient: "Aditya Roy",
    age: "1 yr",
    type: "Check-up",
    doctor: "Dr. Khan",
    department: "General",
  },
  {
    time: "11:00 AM",
    patient: "Ishaan Verma",
    age: "6 yrs",
    type: "Lab Test",
    doctor: "Dr. Joshi",
    department: "Pathology",
  },
]

export function UpcomingAppointments() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{"Today's Appointments"}</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" className="text-xs text-primary">
            View schedule
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {appointments.map((appt, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex flex-col items-center justify-center min-w-14 py-1 px-2 rounded-md bg-primary/5">
                <Clock className="size-3.5 text-primary mb-0.5" />
                <span className="text-xs font-semibold text-primary">{appt.time}</span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium text-foreground truncate">{appt.patient}</span>
                <span className="text-xs text-muted-foreground">
                  {appt.age} &middot; {appt.doctor} &middot; {appt.department}
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {appt.type}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
