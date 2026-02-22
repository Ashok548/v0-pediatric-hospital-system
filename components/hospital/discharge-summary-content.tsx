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
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Pen,
  Download,
  Printer,
  AlertTriangle,
  Pill,
  Activity,
  ClipboardList,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// ─── Patient & Admission Data ──────────────────────────────────
const patient = {
  id: "PED-20260114",
  name: "Rohan Verma",
  dob: "Jun 12, 2022",
  age: "3 years 8 months",
  gender: "Male",
  bloodGroup: "O+",
  weight: "14.2 kg",
  guardian: "Sanjay Verma (Father)",
  phone: "+91 88765 12340",
}

const admission = {
  admissionDate: "Feb 14, 2026",
  admissionTime: "10:32 AM",
  dischargeDate: "Feb 22, 2026",
  dischargeTime: "11:00 AM",
  los: 8,
  ward: "Pediatric General - Bed 42B",
  admittingDoctor: "Dr. Priya Reddy",
  consultants: ["Dr. Priya Reddy (Pediatrics)", "Dr. Anand Joshi (Pulmonology)"],
  diagnosis: "Acute Bronchopneumonia with Moderate Respiratory Distress",
  icdCode: "J18.0",
  admissionType: "Emergency",
  conditionAtAdmission: "Moderate",
  conditionAtDischarge: "Stable / Improved",
}

const hospitalStay = {
  keyFindings: [
    "Bilateral crackles on auscultation; chest X-ray showing right lower lobe consolidation",
    "SpO2 at admission: 89% on room air; required O2 supplementation for 48 hours",
    "Elevated CRP (68 mg/L) and WBC count (18,200/uL) confirming bacterial infection",
    "Blood culture: No growth at 72 hours",
  ],
  treatmentGiven: [
    "IV Ceftriaxone 50mg/kg/day for 5 days, then switched to oral Amoxicillin-Clavulanate",
    "Nebulization with Salbutamol + Ipratropium Bromide QID for 4 days, then PRN",
    "O2 supplementation via nasal prongs (2L/min) for first 48 hours",
    "Antipyretic (Paracetamol 15mg/kg) as needed",
    "IV fluids (DNS) for first 24 hours due to poor oral intake",
  ],
  investigations: [
    { name: "CBC", result: "WBC 18.2K -> 9.8K (normalized)", date: "Feb 14 & 20" },
    { name: "CRP", result: "68 mg/L -> 8 mg/L", date: "Feb 14 & 20" },
    { name: "Chest X-ray", result: "RLL consolidation (clearing on repeat)", date: "Feb 14 & 19" },
    { name: "Blood Culture", result: "No growth at 72 hours", date: "Feb 14" },
    { name: "SpO2 Monitoring", result: "89% -> 97% on room air", date: "Continuous" },
  ],
  dischargeMedications: [
    { name: "Amoxicillin-Clavulanate", dosage: "228.5mg/5ml, 5ml TID", duration: "5 days" },
    { name: "Montelukast", dosage: "4mg OD (chewable)", duration: "14 days" },
    { name: "Salbutamol Inhaler", dosage: "2 puffs via spacer PRN", duration: "As needed" },
    { name: "Paracetamol Syrup", dosage: "5ml PRN for fever", duration: "As needed" },
  ],
  followUpInstructions: [
    "Follow-up visit with Dr. Priya Reddy in 7 days (Mar 1, 2026)",
    "Repeat chest X-ray if cough persists beyond 2 weeks",
    "Continue nebulization at home if wheeze recurs",
    "Ensure completion of full antibiotic course",
    "Return to ER if fever > 102F, breathing difficulty, or poor feeding",
  ],
}

const defaultAiSummary = `DISCHARGE SUMMARY

Patient: Rohan Verma (PED-20260114), 3-year-8-month-old male child, was admitted on 14 Feb 2026 via the emergency department with a 3-day history of high-grade fever, persistent cough, and progressive respiratory distress.

CLINICAL PRESENTATION:
On examination, the child was febrile (102.4F), tachypneic (RR 48/min), with bilateral crackles and reduced air entry in the right lower zone. SpO2 was 89% on room air, indicating moderate hypoxemia. Chest X-ray confirmed right lower lobe consolidation consistent with bronchopneumonia.

HOSPITAL COURSE:
The patient was started on IV Ceftriaxone and nebulization therapy. Oxygen supplementation was provided via nasal prongs for the first 48 hours. Inflammatory markers (CRP 68 mg/L, WBC 18,200) supported the diagnosis of bacterial pneumonia. Blood cultures showed no growth at 72 hours. The child showed significant clinical improvement by Day 3, with defervescence and improving respiratory parameters. IV antibiotics were transitioned to oral Amoxicillin-Clavulanate on Day 5. Repeat labs on Day 6 showed normalizing CRP (8 mg/L) and WBC (9,800). Repeat chest X-ray on Day 5 showed clearing consolidation.

CONDITION AT DISCHARGE:
The child is afebrile for 72+ hours, maintaining SpO2 of 97% on room air, feeding well, and is playful and active. Condition: Stable / Improved.

DISCHARGE MEDICATIONS:
1. Amoxicillin-Clavulanate 228.5mg/5ml - 5ml three times daily for 5 days
2. Montelukast 4mg chewable - once daily for 14 days
3. Salbutamol Inhaler - 2 puffs via spacer as needed for wheeze
4. Paracetamol Syrup - 5ml as needed for fever

FOLLOW-UP:
Review with Dr. Priya Reddy on 01 Mar 2026. Repeat chest X-ray if cough persists beyond 2 weeks. Parents counseled on danger signs requiring emergency visit.

This summary has been generated using CareNest AI Clinical Documentation Assistant and reviewed by the attending physician.`

// ─── Component ─────────────────────────────────────────────────
export function DischargeSummaryContent() {
  const [summary, setSummary] = useState(defaultAiSummary)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isSigned, setIsSigned] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [signatureDrawn, setSignatureDrawn] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  function handleRegenerate() {
    setIsRegenerating(true)
    setTimeout(() => setIsRegenerating(false), 2000)
  }

  function handleSign() {
    if (!signatureDrawn) return
    setIsSigned(true)
    setIsEditing(false)
  }

  // Canvas signature drawing
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
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    setSignatureDrawn(false)
    setIsSigned(false)
  }

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-6 max-w-[1100px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/patients"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Patients
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground font-medium">Discharge Summary</span>
      </div>

      {/* ─── Patient Details Header ───────────────────────────── */}
      <Card className="gap-0 py-0">
        <CardContent className="px-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center size-14 rounded-full bg-primary/10 shrink-0">
                <Baby className="size-7 text-primary" />
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-lg font-bold text-foreground tracking-tight text-balance">
                    {patient.name}
                  </h1>
                  <Badge variant="secondary" className="text-[11px] font-medium">
                    {patient.id}
                  </Badge>
                  <Badge className="text-[11px] font-medium bg-[#22a06b] text-[#ffffff] hover:bg-[#1a7f5a]">
                    Ready for Discharge
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3" />
                    DOB: {patient.dob}
                  </span>
                  <span className="flex items-center gap-1">
                    <User2 className="size-3" />
                    {patient.age} &middot; {patient.gender}
                  </span>
                  <span className="flex items-center gap-1">
                    <Stethoscope className="size-3" />
                    {admission.admittingDoctor}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span>Guardian: {patient.guardian}</span>
                  <span>Blood Group: {patient.bloodGroup}</span>
                  <span>Weight: {patient.weight}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Printer className="size-3.5" />
                <span className="hidden sm:inline">Print</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="size-3.5" />
                <span className="hidden sm:inline">Export PDF</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Hospital Stay Summary ────────────────────────────── */}
      <Card className="gap-0 py-0">
        <CardHeader className="px-5 py-4 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bed className="size-4 text-primary" />
            Hospital Stay Summary
          </CardTitle>
          <CardDescription className="text-xs">
            Admission and clinical course overview
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 py-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Admission</span>
              <span className="text-sm font-semibold text-foreground">{admission.admissionDate}</span>
              <span className="text-xs text-muted-foreground">{admission.admissionTime}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Discharge</span>
              <span className="text-sm font-semibold text-foreground">{admission.dischargeDate}</span>
              <span className="text-xs text-muted-foreground">{admission.dischargeTime}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Length of Stay</span>
              <span className="text-sm font-semibold text-foreground">{admission.los} days</span>
              <span className="text-xs text-muted-foreground">Ward: {admission.ward.split(" - ")[0]}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Type</span>
              <span className="text-sm font-semibold text-foreground">{admission.admissionType}</span>
              <span className="text-xs text-muted-foreground">{admission.ward.split(" - ")[1]}</span>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-border flex flex-col gap-4">
            {/* Diagnosis */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Primary Diagnosis</span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground">{admission.diagnosis}</span>
                <Badge variant="outline" className="text-[10px] font-mono">{admission.icdCode}</Badge>
              </div>
            </div>

            {/* Consultants */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Consulting Physicians</span>
              <div className="flex items-center gap-2 flex-wrap">
                {admission.consultants.map((c) => (
                  <Badge key={c} variant="secondary" className="text-[11px] font-normal">{c}</Badge>
                ))}
              </div>
            </div>

            {/* Condition at Admission/Discharge */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Condition at Admission</span>
                <Badge variant="outline" className="w-fit text-xs font-medium border-warning/40 text-warning-foreground bg-warning/5">
                  {admission.conditionAtAdmission}
                </Badge>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Condition at Discharge</span>
                <Badge variant="outline" className="w-fit text-xs font-medium border-[#22a06b]/40 text-[#1a7f5a] bg-[#22a06b]/5">
                  {admission.conditionAtDischarge}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Clinical Details Grid ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Key Findings */}
        <Card className="gap-0 py-0">
          <CardHeader className="px-5 py-4 border-b border-border">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="size-4 text-primary" />
              Key Clinical Findings
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-4">
            <ul className="flex flex-col gap-2.5" role="list">
              {hospitalStay.keyFindings.map((finding, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-foreground leading-relaxed">
                  <span className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {finding}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Treatment Given */}
        <Card className="gap-0 py-0">
          <CardHeader className="px-5 py-4 border-b border-border">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Pill className="size-4 text-primary" />
              Treatment Administered
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-4">
            <ul className="flex flex-col gap-2.5" role="list">
              {hospitalStay.treatmentGiven.map((tx, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-foreground leading-relaxed">
                  <span className="flex items-center justify-center size-5 rounded-full bg-[#22a06b]/10 text-[#1a7f5a] text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {tx}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* ─── Investigations Table ─────────────────────────────── */}
      <Card className="gap-0 py-0">
        <CardHeader className="px-5 py-4 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ClipboardList className="size-4 text-primary" />
            Investigations Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Investigation</th>
                  <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Result</th>
                  <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {hospitalStay.investigations.map((inv, i) => (
                  <tr key={i} className={cn("border-b border-border last:border-b-0", i % 2 === 0 && "bg-muted/30")}>
                    <td className="px-5 py-3 font-medium text-foreground">{inv.name}</td>
                    <td className="px-5 py-3 text-foreground font-mono text-xs">{inv.result}</td>
                    <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">{inv.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Discharge Medications ────────────────────────────── */}
      <Card className="gap-0 py-0">
        <CardHeader className="px-5 py-4 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Pill className="size-4 text-primary" />
            Discharge Medications
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Medication</th>
                  <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Dosage</th>
                  <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium hidden sm:table-cell">Duration</th>
                </tr>
              </thead>
              <tbody>
                {hospitalStay.dischargeMedications.map((med, i) => (
                  <tr key={i} className={cn("border-b border-border last:border-b-0", i % 2 === 0 && "bg-muted/30")}>
                    <td className="px-5 py-3 font-medium text-foreground">{med.name}</td>
                    <td className="px-5 py-3 text-foreground">{med.dosage}</td>
                    <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">{med.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Follow-up Instructions ───────────────────────────── */}
      <Card className="gap-0 py-0 border-primary/20 bg-primary/[0.02]">
        <CardHeader className="px-5 py-4 border-b border-primary/10">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="size-4 text-primary" />
            Follow-up Instructions & Danger Signs
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-4">
          <ul className="flex flex-col gap-2" role="list">
            {hospitalStay.followUpInstructions.map((inst, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground leading-relaxed">
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                {inst}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* ─── AI Generated Summary ─────────────────────────────── */}
      <Card className="gap-0 py-0">
        <CardHeader className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="size-4 text-primary" />
                AI-Generated Discharge Summary
              </CardTitle>
              <CardDescription className="text-xs">
                Auto-generated by CareNest AI Clinical Documentation Assistant. Review and edit before signing.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!isSigned && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Pen className="size-3.5" />
                    {isEditing ? "Preview" : "Edit"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                  >
                    {isRegenerating ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="size-3.5" />
                    )}
                    {isRegenerating ? "Regenerating..." : "Regenerate"}
                  </Button>
                </>
              )}
              {isSigned && (
                <Badge className="gap-1 text-[11px] bg-[#22a06b] text-[#ffffff] hover:bg-[#1a7f5a]">
                  <Lock className="size-3" />
                  Signed & Locked
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 py-5">
          {isEditing && !isSigned ? (
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full min-h-[500px] p-4 border border-input rounded-lg bg-card text-sm text-foreground font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"
              aria-label="Editable discharge summary"
            />
          ) : (
            <div className={cn(
              "rounded-lg border p-5",
              isSigned
                ? "bg-muted/20 border-[#22a06b]/20"
                : "bg-card border-border"
            )}>
              <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                {summary}
              </pre>
            </div>
          )}

          {isRegenerating && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin text-primary" />
              AI is regenerating the discharge summary based on updated clinical data...
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Doctor Digital Signature ─────────────────────────── */}
      <Card className="gap-0 py-0">
        <CardHeader className="px-5 py-4 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="size-4 text-primary" />
            Doctor&apos;s Digital Signature
          </CardTitle>
          <CardDescription className="text-xs">
            Sign below to authorize and finalize the discharge summary
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 py-5">
          <div className="flex flex-col gap-5">
            {/* Signing Doctor Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Signing Physician</span>
                <span className="text-sm font-semibold text-foreground">Dr. Priya Reddy</span>
                <span className="text-xs text-muted-foreground">MD Pediatrics, IAP Fellow</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Registration No.</span>
                <span className="text-sm font-semibold text-foreground font-mono">MCI-2018-TS-48291</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Date & Time</span>
                <span className="text-sm font-semibold text-foreground">
                  {isSigned ? "Feb 22, 2026, 10:48 AM" : "Pending"}
                </span>
              </div>
            </div>

            {/* Signature Pad */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Signature</span>
              <div className={cn(
                "relative rounded-lg border-2 border-dashed overflow-hidden",
                isSigned
                  ? "border-[#22a06b]/30 bg-[#22a06b]/[0.02]"
                  : "border-border bg-card"
              )}>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={120}
                  className={cn(
                    "w-full h-[120px] touch-none",
                    isSigned ? "cursor-default" : "cursor-crosshair"
                  )}
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
                    <Badge className="gap-1 text-[10px] bg-[#22a06b] text-[#ffffff] hover:bg-[#1a7f5a]">
                      <ShieldCheck className="size-3" />
                      Verified
                    </Badge>
                  </div>
                )}
              </div>
              {!isSigned && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Use your mouse or touch to sign above
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground h-7"
                    onClick={clearSignature}
                    disabled={!signatureDrawn}
                  >
                    Clear Signature
                  </Button>
                </div>
              )}
            </div>

            {/* Actions */}
            {!isSigned ? (
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <Button
                  size="lg"
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleSign}
                  disabled={!signatureDrawn}
                >
                  <CheckCircle2 className="size-4" />
                  Finalize & Sign Discharge Summary
                </Button>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  By signing, you confirm that you have reviewed the discharge summary and all clinical information is accurate.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2 bg-[#22a06b]/8 rounded-lg px-4 py-3 flex-1">
                  <ShieldCheck className="size-5 text-[#22a06b] shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">Discharge Summary Finalized</span>
                    <span className="text-xs text-muted-foreground">
                      Signed by Dr. Priya Reddy on Feb 22, 2026 at 10:48 AM. Document is now locked and ready for printing.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="flex flex-col gap-1 text-[11px] text-muted-foreground border-t border-border pt-4">
        <span>
          CareNest Children&apos;s Hospital &middot; 200-Bed Multi-Speciality Pediatric Facility &middot; NABH Accredited
        </span>
        <span>
          Document generated on {admission.dischargeDate} &middot; AI Summary powered by CareNest Clinical AI v2.4
        </span>
      </div>
    </div>
  )
}
