"use client"

import { Baby, CalendarDays, Stethoscope, User2, Weight } from "lucide-react"

import type { ApiPatient } from "@/lib/api/patients"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

function calcAgeDisplay(dateOfBirth: string): string {
  if (!dateOfBirth) return "Unknown"

  const dob = new Date(dateOfBirth)
  const now = new Date()
  let years = now.getFullYear() - dob.getFullYear()
  let months = now.getMonth() - dob.getMonth()
  let days = now.getDate() - dob.getDate()

  if (days < 0) {
    months--
    days += 30
  }
  if (months < 0) {
    years--
    months += 12
  }
  if (years === 0 && months === 0) return `${days} days`
  if (years === 0) return `${months} month${months !== 1 ? "s" : ""}`
  return `${years}y ${months}mo`
}

interface PatientHeaderProps {
  patient: ApiPatient
  diagnosis?: string
  doctorName?: string
  weightKg?: number | null
}

export function PatientHeader({ patient, diagnosis, doctorName, weightKg }: PatientHeaderProps) {
  return (
    <div className="sticky top-0 z-30 pb-3">
      <Card className="overflow-hidden border-border/70 bg-background/95 shadow-sm backdrop-blur">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Baby className="size-7" />
              </div>

              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl font-semibold tracking-tight text-foreground">
                    {[patient.firstName, patient.lastName].filter(Boolean).join(" ")}
                  </h1>
                  <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[11px] font-semibold">
                    {patient.uhid}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    DOB {new Date(patient.dateOfBirth).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <User2 className="size-3.5" />
                    {calcAgeDisplay(patient.dateOfBirth)} · {patient.gender}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Stethoscope className="size-3.5" />
                    {doctorName || "Attending doctor"}
                  </span>
                </div>

                <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-3 py-2 text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">Diagnosis:</span>{" "}
                  {diagnosis || "Diagnosis pending"}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-stretch">
              <div className="flex min-w-36 flex-col justify-center rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                  <Weight className="size-3.5" />
                  Weight
                </div>
                <div className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
                  {typeof weightKg === "number" ? weightKg.toFixed(weightKg < 10 ? 1 : 0) : "--"}
                  <span className="ml-1 text-sm font-medium text-muted-foreground">kg</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Latest measured weight used for dosing checks
                </div>
              </div>
            </div>
          </div>

          {!!patient.allergies?.length && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                Known Allergies
              </div>
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map((allergy) => (
                  <Badge
                    key={allergy}
                    variant="outline"
                    className="rounded-full border-rose-200 bg-white text-rose-700"
                  >
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}