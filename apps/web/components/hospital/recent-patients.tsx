"use client"

import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAdmissions } from "@/lib/api/admissions"
import type { ApiAdmission } from "@/lib/types/admission"
import Link from "next/link"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"

function getStatusClasses(status: string) {
  switch (status.toUpperCase()) {
    case "CRITICAL":
      return "bg-destructive/10 text-destructive border-destructive/20"
    case "STABLE":
    case "DISCHARGED":
      return "bg-success/10 text-success border-success/20"
    case "ADMITTED":
    case "RECOVERING":
      return "bg-primary/10 text-primary border-primary/20"
    default:
      return "bg-secondary text-secondary-foreground border-border"
  }
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

export function RecentPatients() {
  const { admissions, isLoading } = useAdmissions({
    limit: 6,
    status: 'ADMITTED'
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Admissions</CardTitle>
        <CardAction>
          <Link href="/admissions">
            <Button variant="ghost" size="sm" className="text-xs text-primary">
              View all patients
            </Button>
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto min-h-[300px]">
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
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                  </td>
                </tr>
              ) : admissions?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No recent admissions found.
                  </td>
                </tr>
              ) : (
                admissions?.map((admission: ApiAdmission) => (
                  <tr
                    key={admission.id}
                    className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-[11px] font-medium">
                            {getInitials(`${admission.patient.firstName} ${admission.patient.lastName}`)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-foreground truncate">
                            {admission.patient.firstName} {admission.patient.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {admission.id} &middot; {admission.patient.gender === 'MALE' ? 'M' : 'F'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-foreground">
                        {admission.initialDiagnosis || "Pending Diagnosis"}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 hidden lg:table-cell">
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">{admission.department || "N/A"}</span>
                        <span className="text-xs text-muted-foreground">
                          {admission.currentBed ? `${admission.currentBed.ward.name} · Bed ${admission.currentBed.bedNumber}` : "Bed not assigned"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground truncate max-w-[120px] inline-block">
                        {admission.admittingDoctor?.name ? `Dr. ${admission.admittingDoctor.name}` : "Unassigned"}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 hidden xl:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(admission.admissionDate), "MMM dd, yyyy")}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-semibold border",
                          getStatusClasses(admission.status)
                        )}
                      >
                        {admission.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
