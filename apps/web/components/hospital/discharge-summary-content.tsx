"use client"

import { useState, useRef, useCallback } from "react"
import {
  ArrowLeft,
  Baby,
  CalendarDays,
  User2,
  Stethoscope,
  Bed,
  Clock,
  FileText,
  CheckCircle2,
  Pen,
  Download,
  Printer,
  Loader2,
  Lock,
  ShieldCheck,
  AlertCircle,
  ClipboardList,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { usePatientAdmissions } from "@/lib/api/admissions"
import { differenceInDays, format } from "date-fns"
import type { ApiAdmission } from "@/lib/types/admission"

// ─── Discharge type badge colour helper ──────────────────────────────────────
const DISCHARGE_TYPE_COLORS: Record<string, string> = {
  NORMAL: "bg-emerald-100 text-emerald-700 border-emerald-200",
  LAMA: "bg-amber-100 text-amber-700 border-amber-200",
  REFERRED: "bg-blue-100 text-blue-700 border-blue-200",
  EXPIRED: "bg-red-100 text-red-700 border-red-200",
}

// ─── Clearance Row ──────────────────────────────────────────────────────────
function ClearanceRow({
  label,
  cleared,
  clearedAt,
  clearedBy,
}: {
  label: string
  cleared: boolean
  clearedAt: string | null
  clearedBy: string | null
}) {
  return (
    <div className={cn("flex items-center justify-between px-3 py-2 rounded-lg border text-sm", cleared ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" : "bg-muted/40 border-transparent")}>
      <div className="flex items-center gap-2">
        {cleared ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <Clock className="h-4 w-4 text-muted-foreground shrink-0" />}
        <span className={cn("font-medium", cleared ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground")}>{label}</span>
      </div>
      {cleared && (
        <div className="text-right text-xs text-muted-foreground">
          {clearedBy && <p>{clearedBy}</p>}
          {clearedAt && <p>{format(new Date(clearedAt), "dd MMM, HH:mm")}</p>}
        </div>
      )}
    </div>
  )
}

// ─── Summary content for a discharged admission ──────────────────────────────
function DischargedView({ adm, patientId }: { adm: ApiAdmission; patientId: string }) {
  const [isSigned, setIsSigned] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [summaryText, setSummaryText] = useState(adm.dischargeSummary ?? "")
  const [signatureDrawn, setSignatureDrawn] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  const los = adm.dischargeDate
    ? differenceInDays(new Date(adm.dischargeDate), new Date(adm.admissionDate))
    : null

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ("touches" in e) {
      const touch = e.touches[0]
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isSigned) return
    isDrawingRef.current = true
    lastPointRef.current = getCanvasCoords(e)
    setSignatureDrawn(true)
  }, [isSigned, getCanvasCoords])

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || isSigned) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx || !lastPointRef.current) return
    const coords = getCanvasCoords(e)
    ctx.beginPath()
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
    ctx.lineTo(coords.x, coords.y)
    ctx.strokeStyle = "#1a365d"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.stroke()
    lastPointRef.current = coords
  }, [isSigned, getCanvasCoords])

  const stopDrawing = useCallback(() => {
    isDrawingRef.current = false
    lastPointRef.current = null
  }, [])

  function clearSignature() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignatureDrawn(false)
    setIsSigned(false)
  }

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-6 max-w-[1100px] mx-auto print:p-0 print:gap-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm print:hidden">
        <Link href={`/patients/${patientId}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-3.5" /> Patient
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground font-medium">Discharge Summary</span>
      </div>

      {/* Patient Header */}
      <Card className="gap-0 py-0">
        <CardContent className="px-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center size-14 rounded-full bg-primary/10 shrink-0">
                <Baby className="size-7 text-primary" />
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-lg font-bold text-foreground tracking-tight">
                    {adm.patient.firstName} {adm.patient.lastName}
                  </h1>
                  <Badge variant="secondary" className="text-[11px] font-medium">{adm.patient.uhid}</Badge>
                  <Badge className="text-[11px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white">
                    Discharged
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3" />
                    DOB: {adm.patient.dateOfBirth ? format(new Date(adm.patient.dateOfBirth), "dd MMM yyyy") : "—"}
                  </span>
                  <span className="flex items-center gap-1">
                    <User2 className="size-3" />
                    {adm.patient.gender}
                  </span>
                  {adm.admittingDoctor && (
                    <span className="flex items-center gap-1">
                      <Stethoscope className="size-3" />
                      {adm.admittingDoctor.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span>Guardian: {adm.patient.guardianName}</span>
                  <span>Phone: {adm.patient.phone}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap print:hidden">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => window.print()}>
                <Printer className="size-3.5" /><span className="hidden sm:inline">Print</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="size-3.5" /><span className="hidden sm:inline">Export PDF</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hospital Stay Summary */}
      <Card className="gap-0 py-0">
        <CardHeader className="px-5 py-4 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bed className="size-4 text-primary" /> Hospital Stay Summary
          </CardTitle>
          <CardDescription className="text-xs">Admission and discharge overview</CardDescription>
        </CardHeader>
        <CardContent className="px-5 py-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Admission No.</span>
              <span className="text-sm font-semibold font-mono">{adm.admissionNumber}</span>
              <span className="text-xs text-muted-foreground">{format(new Date(adm.admissionDate), "dd MMM yyyy")}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Discharge</span>
              <span className="text-sm font-semibold">{adm.dischargeDate ? format(new Date(adm.dischargeDate), "dd MMM yyyy") : "—"}</span>
              {adm.dischargeDate && <span className="text-xs text-muted-foreground">{format(new Date(adm.dischargeDate), "hh:mm a")}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Length of Stay</span>
              <span className="text-sm font-semibold">{los != null ? `${los} day${los !== 1 ? "s" : ""}` : "—"}</span>
              <span className="text-xs text-muted-foreground">{adm.department}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Discharge Type</span>
              {adm.dischargeType ? (
                <Badge variant="outline" className={cn("w-fit text-xs font-medium", DISCHARGE_TYPE_COLORS[adm.dischargeType] ?? "")}>{adm.dischargeType}</Badge>
              ) : <span className="text-sm text-muted-foreground">—</span>}
            </div>
          </div>

          {adm.initialDiagnosis && (
            <div className="mt-5 pt-5 border-t border-border">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Initial Diagnosis</span>
              <p className="text-sm font-semibold text-foreground mt-1">{adm.initialDiagnosis}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clearance Audit */}
      <Card className="gap-0 py-0">
        <CardHeader className="px-5 py-4 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ClipboardList className="size-4 text-primary" /> Discharge Clearances
          </CardTitle>
          <CardDescription className="text-xs">Multi-department sign-off audit trail</CardDescription>
        </CardHeader>
        <CardContent className="px-5 py-4 space-y-2">
          <ClearanceRow label="Clinical Clearance" cleared={adm.clinicalCleared} clearedAt={adm.clinicalClearedAt} clearedBy={adm.clinicalClearedBy} />
          <ClearanceRow label="Pharmacy Clearance" cleared={adm.pharmacyCleared} clearedAt={adm.pharmacyClearedAt} clearedBy={adm.pharmacyClearedBy} />
          <ClearanceRow label="Billing Clearance" cleared={adm.billingCleared} clearedAt={adm.billingClearedAt} clearedBy={adm.billingClearedBy} />
        </CardContent>
      </Card>

      {/* Clinical Note */}
      {adm.clinicalNote && (
        <Card className="gap-0 py-0">
          <CardHeader className="px-5 py-4 border-b border-border">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Stethoscope className="size-4 text-primary" /> Clinical Discharge Note
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-4">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{adm.clinicalNote}</p>
          </CardContent>
        </Card>
      )}

      {/* Discharge Summary */}
      <Card className="gap-0 py-0">
        <CardHeader className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="size-4 text-primary" /> Discharge Summary
              </CardTitle>
              <CardDescription className="text-xs">Clinical summary provided at discharge. Review and sign to finalize.</CardDescription>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              {!isSigned && (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setIsEditing(!isEditing)}>
                  <Pen className="size-3.5" />{isEditing ? "Preview" : "Edit"}
                </Button>
              )}
              {isSigned && (
                <Badge className="gap-1 text-[11px] bg-emerald-600 text-white hover:bg-emerald-700">
                  <Lock className="size-3" /> Signed & Locked
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 py-5">
          {isEditing && !isSigned ? (
            <textarea
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
              className="w-full min-h-[300px] p-4 border border-input rounded-lg bg-card text-sm text-foreground font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"
              aria-label="Editable discharge summary"
            />
          ) : summaryText ? (
            <div className={cn("rounded-lg border p-5", isSigned ? "bg-muted/20 border-emerald-200 dark:border-emerald-800" : "bg-card border-border")}>
              <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">{summaryText}</pre>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm bg-muted/20 rounded-lg border border-dashed">
              No discharge summary was written for this admission.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Doctor Digital Signature */}
      <Card className="gap-0 py-0 print:border-0 print:shadow-none">
        <CardHeader className="px-5 py-4 border-b border-border print:hidden">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="size-4 text-primary" /> Doctor&apos;s Digital Signature
          </CardTitle>
          <CardDescription className="text-xs">Sign to authorize and lock the discharge summary</CardDescription>
        </CardHeader>
        <CardContent className="px-5 py-5 print:p-0">
          <div className="flex flex-col gap-5">
            {/* Signature Pad */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Signature</span>
              <div className={cn("relative rounded-lg border-2 border-dashed overflow-hidden", isSigned ? "border-emerald-500/30 bg-emerald-50/30" : "border-border bg-card")}>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={120}
                  className={cn("w-full h-[120px] touch-none", isSigned ? "cursor-default" : "cursor-crosshair")}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  aria-label="Signature canvas"
                />
                {!signatureDrawn && !isSigned && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-sm text-muted-foreground/50">Draw your signature here</span>
                  </div>
                )}
                {isSigned && (
                  <div className="absolute top-2 right-2">
                    <Badge className="gap-1 text-[10px] bg-emerald-600 text-white hover:bg-emerald-700">
                      <ShieldCheck className="size-3" /> Verified
                    </Badge>
                  </div>
                )}
              </div>
              {!isSigned && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Use your mouse or touch to sign above</span>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={clearSignature} disabled={!signatureDrawn}>Clear Signature</Button>
                </div>
              )}
            </div>

            {/* Actions */}
            {!isSigned ? (
              <div className="flex items-center gap-3 pt-2 border-t border-border print:hidden">
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={() => { setIsSigned(true); setIsEditing(false) }}
                  disabled={!signatureDrawn}
                >
                  <CheckCircle2 className="size-4" /> Finalize & Sign Discharge Summary
                </Button>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  By signing, you confirm that you have reviewed the discharge summary and all clinical information is accurate.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 pt-4 border-t border-border print:hidden">
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-4 py-3 flex-1">
                  <ShieldCheck className="size-5 text-emerald-600 shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold">Discharge Summary Signed</span>
                    <span className="text-xs text-muted-foreground">Document is locked and ready for printing.</span>
                  </div>
                </div>
                <Button onClick={() => window.print()} className="gap-2 shrink-0">
                  <Printer className="size-4" /> Print / Save PDF
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="flex flex-col gap-1 text-[11px] text-muted-foreground border-t border-border pt-4">
        <span>CareNest Children&apos;s Hospital · 200-Bed Multi-Speciality Pediatric Facility · NABH Accredited</span>
        {adm.dischargeDate && (
          <span>Document generated on {format(new Date(adm.dischargeDate), "dd MMM yyyy")}</span>
        )}
      </div>
    </div>
  )
}

// ─── Page for a patient whose discharge is still IN PROGRESS ────────────────
function InProgressView({ adm, patientId }: { adm: ApiAdmission; patientId: string }) {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <Link href={`/patients/${patientId}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-3.5" /> Patient
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground font-medium">Discharge Clearance</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Discharge Clearance</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {adm.patient.firstName} {adm.patient.lastName} · {adm.admissionNumber}
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Discharge clearance is in progress. Please complete all department sign-offs on the discharge page.
          </p>
          <Link href={`/admissions/${adm.id}/discharge`} className="mt-3 inline-block">
            <Button size="sm" className="gap-2">
              Go to Discharge Stepper
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <ClearanceRow label="Clinical Clearance" cleared={adm.clinicalCleared} clearedAt={adm.clinicalClearedAt} clearedBy={adm.clinicalClearedBy} />
        <ClearanceRow label="Pharmacy Clearance" cleared={adm.pharmacyCleared} clearedAt={adm.pharmacyClearedAt} clearedBy={adm.pharmacyClearedBy} />
        <ClearanceRow label="Billing Clearance" cleared={adm.billingCleared} clearedAt={adm.billingClearedAt} clearedBy={adm.billingClearedBy} />
      </div>
    </div>
  )
}

// ─── Root exported component ─────────────────────────────────────────────────
export function DischargeSummaryContent({ patientId }: { patientId?: string }) {
  const { admissions, isLoading, error } = usePatientAdmissions(patientId ?? null)

  if (!patientId) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No patient specified.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1100px] mx-auto space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-3 text-destructive">
        <AlertCircle className="h-10 w-10" />
        <p className="font-medium">Failed to load patient admissions</p>
        <p className="text-sm text-muted-foreground">{error?.message}</p>
        <Link href={`/patients/${patientId}`}><Button variant="outline">Back to Patient</Button></Link>
      </div>
    )
  }

  // Find the most recent discharged or in-progress discharge admission
  const discharged = admissions.find(a => a.status === "DISCHARGED")
  const inProgress = admissions.find(a => a.dischargeStatus === "IN_PROGRESS")
  const target = discharged ?? inProgress

  if (!target) {
    return (
      <div className="p-6 max-w-xl mx-auto space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/patients/${patientId}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Patient
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground font-medium">Discharge Summary</span>
        </div>
        <div className="text-center py-16 text-muted-foreground space-y-2">
          <ClipboardList className="h-12 w-12 mx-auto opacity-40" />
          <p className="font-medium">No discharge record found</p>
          <p className="text-sm">This patient has not been discharged yet.</p>
        </div>
      </div>
    )
  }

  if (target.status === "DISCHARGED") {
    return <DischargedView adm={target} patientId={patientId} />
  }

  return <InProgressView adm={target} patientId={patientId} />
}
