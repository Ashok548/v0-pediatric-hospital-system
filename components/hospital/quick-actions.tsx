import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  UserPlus,
  CalendarPlus,
  FileText,
  FlaskConical,
  Syringe,
  CreditCard,
} from "lucide-react"

const actions = [
  { label: "New Patient", icon: UserPlus, description: "Register admission" },
  { label: "Book Appointment", icon: CalendarPlus, description: "Schedule visit" },
  { label: "New Prescription", icon: FileText, description: "Write Rx" },
  { label: "Order Lab Test", icon: FlaskConical, description: "Request tests" },
  { label: "Vaccination", icon: Syringe, description: "Administer vaccine" },
  { label: "Generate Bill", icon: CreditCard, description: "Create invoice" },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="flex flex-col items-center gap-1.5 h-auto py-4 px-3 hover:bg-primary/5 hover:border-primary/30 transition-all"
            >
              <action.icon className="size-5 text-primary" />
              <span className="text-xs font-medium text-foreground">{action.label}</span>
              <span className="text-[10px] text-muted-foreground">{action.description}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
