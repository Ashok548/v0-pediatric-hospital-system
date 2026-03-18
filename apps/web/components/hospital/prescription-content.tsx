"use client"

import { useState, useCallback } from "react"
import {
  ArrowLeft,
  Baby,
  CalendarDays,
  User2,
  Stethoscope,
  Weight,
  Plus,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Printer,
  Download,
  Pill,
  Clock,
  Info,
  Search,
  XCircle,
  AlertOctagon,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePharmacyInventory, createPrescription } from "@/lib/api/pharmacy"
import { usePatients, usePatient } from "@/lib/api/patients"
import { useAuthStore } from "@/lib/store/auth-store"
import { VoiceRecorder } from "@/components/VoiceRecorder"
import { appendTranscript } from "@/lib/utils/transcript"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

// ─── Patient Data ──────────────────────────────────────────────
function calcAgeDisplay(dateOfBirth: string): string {
    if (!dateOfBirth) return "Unknown"
    const dob = new Date(dateOfBirth)
    const now = new Date()
    let years = now.getFullYear() - dob.getFullYear()
    let months = now.getMonth() - dob.getMonth()
    let days = now.getDate() - dob.getDate()
    if (days < 0) { months--; days += 30 }
    if (months < 0) { years--; months += 12 }
    if (years === 0 && months === 0) return `${days} days`
    if (years === 0) return `${months} month${months !== 1 ? "s" : ""}`
    return `${years}y ${months}mo`
}

// ─── Drug Database ─────────────────────────────────────────────
interface Drug {
  id: string
  name: string
  generic: string
  category: string
  forms: string[]
  defaultForm: string
  maxDosePerKg: number
  unit: string
  frequencies: string[]
  defaultFrequency: string
  contraindications: string[]
  interactions: string[]
  notes: string
}

const drugDatabase: Drug[] = [
  {
    id: "amoxicillin",
    name: "Amoxicillin",
    generic: "Amoxicillin Trihydrate",
    category: "Antibiotic",
    forms: ["Suspension 125mg/5ml", "Suspension 250mg/5ml", "Tablet 250mg", "Tablet 500mg"],
    defaultForm: "Suspension 250mg/5ml",
    maxDosePerKg: 45,
    unit: "mg/kg/day",
    frequencies: ["TID (8-hourly)", "BID (12-hourly)"],
    defaultFrequency: "TID (8-hourly)",
    contraindications: ["Penicillin allergy"],
    interactions: ["Methotrexate", "Warfarin"],
    notes: "Divide daily dose into equal intervals. Administer with or without food.",
  },
  {
    id: "paracetamol",
    name: "Paracetamol",
    generic: "Acetaminophen",
    category: "Antipyretic / Analgesic",
    forms: ["Syrup 120mg/5ml", "Syrup 250mg/5ml", "Tablet 500mg", "Suppository 125mg"],
    defaultForm: "Syrup 120mg/5ml",
    maxDosePerKg: 60,
    unit: "mg/kg/day",
    frequencies: ["QID (6-hourly)", "TID (8-hourly)", "PRN (as needed)"],
    defaultFrequency: "QID (6-hourly)",
    contraindications: ["Severe hepatic impairment"],
    interactions: ["Warfarin", "Carbamazepine"],
    notes: "Do not exceed 60mg/kg/day. Min interval 4 hours between doses.",
  },
  {
    id: "azithromycin",
    name: "Azithromycin",
    generic: "Azithromycin Dihydrate",
    category: "Antibiotic (Macrolide)",
    forms: ["Suspension 100mg/5ml", "Suspension 200mg/5ml", "Tablet 250mg", "Tablet 500mg"],
    defaultForm: "Suspension 200mg/5ml",
    maxDosePerKg: 10,
    unit: "mg/kg/day",
    frequencies: ["OD (once daily)"],
    defaultFrequency: "OD (once daily)",
    contraindications: ["Hepatic dysfunction", "QT prolongation"],
    interactions: ["Amoxicillin", "Warfarin", "Antacids"],
    notes: "Give 1 hour before or 2 hours after meals. Usual course: 3-5 days.",
  },
  {
    id: "cetirizine",
    name: "Cetirizine",
    generic: "Cetirizine Hydrochloride",
    category: "Antihistamine",
    forms: ["Syrup 5mg/5ml", "Tablet 10mg"],
    defaultForm: "Syrup 5mg/5ml",
    maxDosePerKg: 0.5,
    unit: "mg/kg/day",
    frequencies: ["OD (once daily)", "BID (12-hourly)"],
    defaultFrequency: "OD (once daily)",
    contraindications: ["Severe renal impairment"],
    interactions: ["CNS depressants", "Theophylline"],
    notes: "May cause drowsiness. Give at bedtime if once daily.",
  },
  {
    id: "montelukast",
    name: "Montelukast",
    generic: "Montelukast Sodium",
    category: "Leukotriene Receptor Antagonist",
    forms: ["Chewable Tablet 4mg", "Chewable Tablet 5mg", "Granules 4mg"],
    defaultForm: "Chewable Tablet 4mg",
    maxDosePerKg: 0.4,
    unit: "mg/kg/day",
    frequencies: ["OD (once daily at bedtime)"],
    defaultFrequency: "OD (once daily at bedtime)",
    contraindications: ["Phenylketonuria (chewable tablets contain phenylalanine)"],
    interactions: ["Phenobarbital", "Rifampicin"],
    notes: "Administer in the evening. For children 2-5 years: 4mg/day.",
  },
  {
    id: "prednisolone",
    name: "Prednisolone",
    generic: "Prednisolone",
    category: "Corticosteroid",
    forms: ["Syrup 5mg/5ml", "Syrup 15mg/5ml", "Tablet 5mg", "Tablet 10mg"],
    defaultForm: "Syrup 5mg/5ml",
    maxDosePerKg: 2,
    unit: "mg/kg/day",
    frequencies: ["OD (once daily)", "BID (12-hourly)"],
    defaultFrequency: "OD (once daily)",
    contraindications: ["Systemic fungal infections", "Live vaccines"],
    interactions: ["NSAIDs", "Phenytoin", "Carbamazepine"],
    notes: "Administer with food. Taper dose if used for > 5 days.",
  },
  {
    id: "ondansetron",
    name: "Ondansetron",
    generic: "Ondansetron Hydrochloride",
    category: "Antiemetic",
    forms: ["Syrup 4mg/5ml", "Tablet 4mg (ODT)", "Injection 2mg/ml"],
    defaultForm: "Syrup 4mg/5ml",
    maxDosePerKg: 0.3,
    unit: "mg/kg/dose",
    frequencies: ["TID (8-hourly)", "BID (12-hourly)", "PRN (as needed)"],
    defaultFrequency: "TID (8-hourly)",
    contraindications: ["QT prolongation", "Congenital long QT syndrome"],
    interactions: ["Apomorphine", "Tramadol"],
    notes: "Max single dose: 4mg for children < 12 years.",
  },
  {
    id: "salbutamol",
    name: "Salbutamol Inhaler",
    generic: "Salbutamol Sulphate",
    category: "Bronchodilator",
    forms: ["MDI 100mcg/puff", "Nebulisation 2.5mg/2.5ml", "Syrup 2mg/5ml"],
    defaultForm: "MDI 100mcg/puff",
    maxDosePerKg: 0.15,
    unit: "mg/kg/dose (neb)",
    frequencies: ["QID (6-hourly)", "PRN (as needed)"],
    defaultFrequency: "PRN (as needed)",
    contraindications: ["Hypertrophic obstructive cardiomyopathy"],
    interactions: ["Beta-blockers", "Digoxin"],
    notes: "Use with spacer for MDI. 2 puffs standard for children 2-5 years.",
  },
]

// ─── Prescription Row Type ─────────────────────────────────────
interface PrescriptionRow {
  id: number
  drugId: string // This will now be the DB medication.id
  drugName: string
  genericName: string
  form: string
  dose: string
  frequency: string
  duration: string
  route: string
  instructions: string
}

// ─── Helpers ───────────────────────────────────────────────────
function getClinicalDrug(drugName: string, genericName: string) {
  return drugDatabase.find((d) => 
    drugName.toLowerCase().includes(d.name.toLowerCase()) || 
    d.generic.toLowerCase().includes(genericName.toLowerCase()) ||
    genericName.toLowerCase().includes(d.generic.toLowerCase())
  )
}

function checkOverdose(drugName: string, genericName: string, doseStr: string, weightKg: number) {
  const clinical = getClinicalDrug(drugName, genericName)
  if (!clinical || !doseStr) return null
  const dose = parseFloat(doseStr)
  if (isNaN(dose)) return null
  const maxTotal = clinical.maxDosePerKg * weightKg
  if (dose > maxTotal) {
    return {
      entered: dose,
      max: maxTotal,
      maxPerKg: clinical.maxDosePerKg,
      unit: clinical.unit,
    }
  }
  return null
}

function checkInteractions(medications: { name: string; generic: string }[]): { drugA: string; drugB: string; reason: string }[] {
  const results: { drugA: string; drugB: string; reason: string }[] = []
  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const drugA = getClinicalDrug(medications[i].name, medications[i].generic)
      const drugB = getClinicalDrug(medications[j].name, medications[j].generic)
      if (!drugA || !drugB) continue
      
      if (drugA.interactions.some((x) => drugB.name.toLowerCase().includes(x.toLowerCase()))) {
        results.push({
          drugA: medications[i].name,
          drugB: medications[j].name,
          reason: `${drugA.name} has a known interaction with ${drugB.name}. Concurrent use may alter efficacy or increase adverse effects.`,
        })
      }
      if (drugB.interactions.some((x) => drugA.name.toLowerCase().includes(x.toLowerCase()))) {
        if (!results.find((r) => r.drugA === medications[j].name && r.drugB === medications[i].name)) {
          results.push({
            drugA: medications[j].name,
            drugB: medications[i].name,
            reason: `${drugB.name} has a known interaction with ${drugA.name}. Review dosing and monitor closely.`,
          })
        }
      }
    }
  }
  return results
}

function checkAllergyConflict(drugName: string, genericName: string, allergies: string[]) {
  const clinical = getClinicalDrug(drugName, genericName)
  for (const allergy of allergies) {
    if (drugName.toLowerCase().includes(allergy.toLowerCase()) ||
      genericName.toLowerCase().includes(allergy.toLowerCase()) ||
      (clinical && clinical.contraindications.some((c) => c.toLowerCase().includes(allergy.toLowerCase())))) {
      return { drug: drugName, allergy }
    }
  }
  return null
}

// ─── Component ─────────────────────────────────────────────────
export function PrescriptionContent({ patientId }: { patientId?: string } = {}) {
  const { currentUser } = useAuthStore()
  const { inventory } = usePharmacyInventory()
  const { patients } = usePatients(patientId ? { search: patientId } : undefined)
  const activePatientId = patientId || (patients?.[0]?.id)
  const { patient: realPatient, isLoading: patientLoading } = usePatient(activePatientId || null)

  const patientData = realPatient ? {
    id: realPatient.uhid || realPatient.id,
    name: `${realPatient.firstName || ''} ${realPatient.lastName || ''}`.trim(),
    dob: realPatient.dateOfBirth ? new Date(realPatient.dateOfBirth).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
    age: realPatient.dateOfBirth ? calcAgeDisplay(realPatient.dateOfBirth) : "—",
    gender: realPatient.gender === "MALE" ? "Male" : realPatient.gender === "FEMALE" ? "Female" : "Other",
    bloodGroup: (realPatient as any).bloodGroup || "—",
    weight: (realPatient as any).birthWeight ? parseFloat((realPatient as any).birthWeight) : 10,
    bsa: "—",
    allergies: (realPatient as any).allergies || [],
    guardian: (realPatient as any).guardianName || "—",
    phone: realPatient.phone || "—",
    diagnosis: "General Checkup",
    doctor: currentUser?.name || "Dr. Priya Reddy",
  } : null

  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([])
  const [nextId, setNextId] = useState(3)
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false)
  const [pendingInteractions, setPendingInteractions] = useState<{ drugA: string; drugB: string; reason: string }[]>([])
  const [allergyDialogOpen, setAllergyDialogOpen] = useState(false)
  const [pendingAllergyConflict, setPendingAllergyConflict] = useState<{ drug: string; allergy: string } | null>(null)
  const [drugSearchQuery, setDrugSearchQuery] = useState("")
  const [showDrugSearch, setShowDrugSearch] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const filteredDrugs = (drugSearchQuery.trim()
    ? inventory.filter(
      (m) =>
        m.drugName.toLowerCase().includes(drugSearchQuery.toLowerCase()) ||
        m.genericName.toLowerCase().includes(drugSearchQuery.toLowerCase())
    )
    : inventory).filter(m => m.status !== 'INACTIVE')

  const addDrug = useCallback(
    (medicationId: string) => {
      const dbMed = inventory.find(m => m.id === medicationId)
      if (!dbMed) return

      // Allergy check
      const allergyConflict = checkAllergyConflict(dbMed.drugName, dbMed.genericName, patientData?.allergies || [])
      if (allergyConflict) {
        setPendingAllergyConflict(allergyConflict)
        setAllergyDialogOpen(true)
        setShowDrugSearch(false)
        setDrugSearchQuery("")
        return
      }

      // Add the drug
      const clinicalInfo = getClinicalDrug(dbMed.drugName, dbMed.genericName)
      const newRow: PrescriptionRow = {
        id: nextId,
        drugId: dbMed.id,
        drugName: dbMed.drugName,
        genericName: dbMed.genericName,
        form: clinicalInfo?.defaultForm || dbMed.form,
        dose: "",
        frequency: clinicalInfo?.defaultFrequency || "OD (once daily)",
        duration: "",
        route: "Oral",
        instructions: "",
      }

      const updatedList = [...prescriptions, newRow]
      setNextId((p) => p + 1)

      // Interaction check
      const allMedsForInteraction = updatedList.map((r) => ({ name: r.drugName, generic: r.genericName }))
      const interactions = checkInteractions(allMedsForInteraction)
      if (interactions.length > 0) {
        setPendingInteractions(interactions)
        setInteractionDialogOpen(true)
      }

      setPrescriptions(updatedList)
      setShowDrugSearch(false)
      setDrugSearchQuery("")
    },
    [prescriptions, nextId]
  )

  const removeDrug = useCallback((id: number) => {
    setPrescriptions((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const updateRow = useCallback((id: number, field: keyof PrescriptionRow, value: string) => {
    setPrescriptions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    )
  }, [])

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (bypassInteractions = false) => {
    const isBypass = typeof bypassInteractions === 'boolean' ? bypassInteractions : false;
    
    if (!isBypass) {
      const interactions = checkInteractions(prescriptions.map((r) => ({ name: r.drugName, generic: r.genericName })))
      if (interactions.length > 0) {
        setPendingInteractions(interactions)
        setInteractionDialogOpen(true)
        toast.error(`Detected ${interactions.length} drug interaction warning${interactions.length !== 1 ? 's' : ''}. Please review before continuing.`)
        return
      }
    }

    if (!activePatientId && !patientId) {
      toast.error("Valid patient required to send prescription.")
      return
    }

    if (!currentUser?.id) {
      toast.error("You must be logged in as a valid Doctor to prescribe medications.")
      return
    }

    setIsSubmitting(true)
    try {
      const itemsPayload = []
      for (const row of prescriptions) {
        // Find fresh medication object to ensure we have valid reference
        const dbMed = inventory.find(m => m.id === row.drugId)

        if (!dbMed) {
          toast.error(`Medication for ${row.drugName} not found in Pharmacy Inventory. Please alert admin to add it to Data Master.`)
          setIsSubmitting(false)
          return
        }

        // Intelligent quantity calculation
        const days = parseInt(row.duration) || 1
        let dosesPerDay = 1
        const freq = row.frequency.toLowerCase()
        if (freq.includes('bid') || freq.includes('12-hourly')) dosesPerDay = 2
        if (freq.includes('tid') || freq.includes('8-hourly')) dosesPerDay = 3
        if (freq.includes('qid') || freq.includes('6-hourly')) dosesPerDay = 4
        
        let qty = dosesPerDay * days // Default to dose count (e.g. tablets)
        
        const formLower = dbMed.form.toLowerCase();
        const strengthStr = dbMed.strength.toLowerCase();
        const isLiquid = formLower.includes('syrup') || formLower.includes('suspension') || formLower.includes('liquid') || strengthStr.includes('/ml');
        const doseMg = parseFloat(row.dose);

        if (isLiquid && !isNaN(doseMg)) {
            // Try to parse concentration (e.g. "125mg/5ml")
            const concentrationMatch = dbMed.strength.match(/(\d+)\s*mg\s*\/\s*(\d+)\s*ml/i);
            if (concentrationMatch) {
                const mgInConcentration = parseFloat(concentrationMatch[1]);
                const mlInConcentration = parseFloat(concentrationMatch[2]);
                const mlPerDose = (doseMg / mgInConcentration) * mlInConcentration;
                const totalMlNeeded = mlPerDose * dosesPerDay * days;
                
                // If unit is "bottles", we need to know bottle size
                if (dbMed.unit.toLowerCase().includes('bottle')) {
                    const bottleSizeMatch = dbMed.strength.match(/\((\d+)\s*ml\)/i) || dbMed.strength.match(/(\d+)\s*ml/);
                    const bottleSize = bottleSizeMatch ? parseFloat(bottleSizeMatch[1]) : 60; // Fallback to 60ml
                    qty = Math.ceil(totalMlNeeded / bottleSize);
                } else {
                    qty = Math.ceil(totalMlNeeded); // MLs
                }
            }
        } else if (!isNaN(doseMg)) {
            // For tablets/capsules, check if dose matches strength
            const strengthMatch = dbMed.strength.match(/(\d+)\s*mg/i);
            if (strengthMatch) {
                const mgPerTab = parseFloat(strengthMatch[1]);
                const tabsPerDose = doseMg / mgPerTab;
                qty = Math.ceil(tabsPerDose * dosesPerDay * days);
            }
        }

        itemsPayload.push({
          medicationId: dbMed.id,
          prescribedQty: qty > 0 ? qty : 1,
          dose: row.dose,
          frequency: row.frequency,
          duration: days,
          instructions: row.instructions
        })
      }

      await createPrescription({
        patientId: activePatientId,
        doctorId: currentUser?.id,
        notes: prescriptions[0]?.instructions || "Generated from Dashboard",
        items: itemsPayload
      })

      toast.success("Prescription signed and sent to Pharmacy successfully.")
      setSubmitted(true)
    } catch (err: any) {
      toast.error(err.message || "Failed to submit prescription")
    } finally {
      setIsSubmitting(false)
    }
  }

  // current interactions for display
  const currentInteractions = checkInteractions(prescriptions.map((r) => ({ name: r.drugName, generic: r.genericName })))

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-[1200px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href={patientId ? `/patients/${patientId}` : "/patients"}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          {patientId ? "Patient" : "Patients"}
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground font-medium">Prescription Entry</span>
      </div>

      {/* ─── Patient Header ──────────────────────────────────── */}
      {patientLoading || !patientData ? (
        <Card className="gap-0 py-0">
          <CardContent className="px-5 py-10 flex justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
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
                    {patientData.name}
                  </h1>
                  <Badge variant="secondary" className="text-[11px] font-medium">
                    {patientData.id}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3" />
                    DOB: {patientData.dob}
                  </span>
                  <span className="flex items-center gap-1">
                    <User2 className="size-3" />
                    {patientData.age} &middot; {patientData.gender}
                  </span>
                  <span className="flex items-center gap-1">
                    <Stethoscope className="size-3" />
                    {patientData.doctor}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span>Dx: {patientData.diagnosis}</span>
                </div>
              </div>
            </div>

            {/* Weight Display -- prominent */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-primary/30 bg-primary/5 px-5 py-3">
                <div className="flex items-center gap-1.5 text-primary">
                  <Weight className="size-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Weight</span>
                </div>
                <span className="text-2xl font-bold text-foreground mt-0.5">{patientData.weight} <span className="text-sm font-medium text-muted-foreground">kg</span></span>
                <span className="text-[10px] text-muted-foreground mt-0.5">BSA: {patientData.bsa}</span>
              </div>
            </div>
          </div>

          {/* Allergy Banner */}
          {patientData.allergies.length > 0 && (
            <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
              <AlertOctagon className="size-4 text-destructive shrink-0" />
              <span className="text-xs font-semibold text-destructive">KNOWN ALLERGIES:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {patientData.allergies.map((a: string) => (
                  <Badge
                    key={a}
                    className="text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/10"
                  >
                    {a}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* ─── Drug Interaction Alert (persistent) ─────────────── */}
      {currentInteractions.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border-2 border-destructive/40 bg-destructive/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-destructive shrink-0" />
            <span className="text-sm font-bold text-destructive">Drug Interaction Warning</span>
          </div>
          {currentInteractions.map((interaction, idx) => (
            <div key={idx} className="flex items-start gap-2 ml-7 text-xs text-foreground leading-relaxed">
              <XCircle className="size-3.5 text-destructive shrink-0 mt-0.5" />
              <span>
                <strong>{interaction.drugA}</strong> + <strong>{interaction.drugB}</strong>: {interaction.reason}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ─── Prescription Table ──────────────────────────────── */}
      <Card className="gap-0 py-0">
        <CardHeader className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Pill className="size-4 text-primary" />
                Prescription
              </CardTitle>
              <CardDescription className="text-xs">
                {prescriptions.length} medication{prescriptions.length !== 1 ? "s" : ""} prescribed
              </CardDescription>
            </div>
            <div className="relative">
              <Button
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setShowDrugSearch(!showDrugSearch)}
              >
                <Plus className="size-3.5" />
                Add Medicine
              </Button>

              {/* Drug search dropdown */}
              {showDrugSearch && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-card shadow-lg z-50">
                  <div className="p-3 border-b border-border">
                    <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                      <Search className="size-4 text-muted-foreground shrink-0" />
                      <input
                        type="text"
                        placeholder="Search medicine name or category..."
                        className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
                        value={drugSearchQuery}
                        onChange={(e) => setDrugSearchQuery(e.target.value)}
                        autoFocus
                        aria-label="Search medicines"
                      />
                    </div>
                  </div>
                  <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
                    {filteredDrugs.length === 0 ? (
                      <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                        No medicines found
                      </li>
                    ) : (
                      filteredDrugs.map((medication) => {
                        const alreadyAdded = prescriptions.some((r) => r.drugId === medication.id)
                        const isLowStock = medication.stockAvailable <= medication.reorderLevel;
                        
                        return (
                          <li key={medication.id}>
                            <button
                              className={cn(
                                "w-full text-left px-4 py-2.5 hover:bg-muted/60 transition-colors flex flex-col gap-0.5",
                                alreadyAdded && "opacity-50 pointer-events-none"
                              )}
                              onClick={() => addDrug(medication.id)}
                              disabled={alreadyAdded}
                              role="option"
                              aria-selected={false}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">{medication.drugName}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className={cn("text-xs flex items-center gap-1 font-medium", isLowStock ? "text-amber-600 dark:text-amber-500" : "text-green-600 dark:text-green-500")}>
                                        Stock: {medication.stockAvailable}
                                    </span>
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">{medication.genericName} • {medication.form} {medication.strength}</span>
                              {alreadyAdded && (
                                <span className="text-[10px] text-primary font-medium">Already added</span>
                              )}
                            </button>
                          </li>
                        )
                      })
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0 py-0">
          {prescriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="flex items-center justify-center size-14 rounded-full bg-muted">
                <Pill className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No medications added yet</p>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => setShowDrugSearch(true)}
              >
                <Plus className="size-3.5" />
                Add First Medicine
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {prescriptions.map((row, index) => {
                const clinicalInfo = getClinicalDrug(row.drugName, row.genericName)
                const overdose = checkOverdose(row.drugName, row.genericName, row.dose, patientData?.weight || 10)
                const allergyConflict = checkAllergyConflict(row.drugName, row.genericName, patientData?.allergies || [])
                
                const forms = clinicalInfo?.forms || [row.form]

                return (
                  <div key={row.id} className="px-5 py-5">
                    {/* Drug Header Row */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center size-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-foreground">{row.drugName}</span>
                            {clinicalInfo?.category && <Badge variant="secondary" className="text-[10px]">{clinicalInfo.category}</Badge>}
                          </div>
                          <span className="text-xs text-muted-foreground">{row.genericName}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeDrug(row.id)}
                        aria-label={`Remove ${row.drugName}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    {/* Allergy Conflict Alert */}
                    {allergyConflict && (
                      <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 mb-4">
                        <AlertOctagon className="size-4 text-destructive shrink-0" />
                        <span className="text-xs font-semibold text-destructive">
                          ALLERGY CONFLICT: Patient is allergic to {allergyConflict.allergy}
                        </span>
                      </div>
                    )}

                    {/* Input Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {/* Form */}
                      <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1 lg:col-span-2">
                        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                          Form / Strength
                        </Label>
                        <Select
                          value={row.form}
                          onValueChange={(val) => updateRow(row.id, "form", val)}
                        >
                          <SelectTrigger className="h-9 text-xs w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {forms.map((f) => (
                              <SelectItem key={f} value={f} className="text-xs">
                                {f}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Dose */}
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                          Dose (mg)
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="e.g. 250"
                            className={cn(
                              "h-9 text-xs pr-8",
                              overdose && "border-destructive ring-destructive/20 ring-2"
                            )}
                            value={row.dose}
                            onChange={(e) => updateRow(row.id, "dose", e.target.value)}
                            aria-label="Dose"
                            aria-invalid={!!overdose}
                          />
                          {overdose && (
                            <AlertTriangle className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-destructive" />
                          )}
                        </div>
                        {/* Computed safe range */}
                        {clinicalInfo?.maxDosePerKg && (
                          <span className="text-[10px] text-muted-foreground">
                            Max: {(clinicalInfo.maxDosePerKg * (patientData?.weight || 10)).toFixed(0)} mg/day ({clinicalInfo.maxDosePerKg} {clinicalInfo.unit})
                          </span>
                        )}
                      </div>

                      {/* Frequency */}
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                          Frequency
                        </Label>
                        <Select
                          value={row.frequency}
                          onValueChange={(val) => updateRow(row.id, "frequency", val)}
                        >
                          <SelectTrigger className="h-9 text-xs w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(clinicalInfo?.frequencies || ["OD (once daily)", "BID (12-hourly)", "TID (8-hourly)", "QID (6-hourly)", "PRN (as needed)"]).map((f) => (
                              <SelectItem key={f} value={f} className="text-xs">
                                {f}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Duration */}
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                          Duration (days)
                        </Label>
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            placeholder="e.g. 5"
                            className="h-9 text-xs"
                            value={row.duration}
                            onChange={(e) => updateRow(row.id, "duration", e.target.value)}
                            aria-label="Duration in days"
                          />
                          <Clock className="size-3.5 text-muted-foreground shrink-0" />
                        </div>
                      </div>

                      {/* Route */}
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                          Route
                        </Label>
                        <Select
                          value={row.route}
                          onValueChange={(val) => updateRow(row.id, "route", val)}
                        >
                          <SelectTrigger className="h-9 text-xs w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Oral" className="text-xs">Oral</SelectItem>
                            <SelectItem value="IV" className="text-xs">Intravenous</SelectItem>
                            <SelectItem value="IM" className="text-xs">Intramuscular</SelectItem>
                            <SelectItem value="Topical" className="text-xs">Topical</SelectItem>
                            <SelectItem value="Inhaled" className="text-xs">Inhaled</SelectItem>
                            <SelectItem value="Rectal" className="text-xs">Rectal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Overdose Warning */}
                    {overdose && (
                      <div className="mt-3 flex items-start gap-2.5 rounded-lg border-2 border-destructive/50 bg-destructive/5 px-3 py-2.5">
                        <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-destructive">OVERDOSE WARNING</span>
                          <span className="text-xs text-foreground leading-relaxed">
                            Entered dose ({overdose.entered} mg) exceeds the maximum safe dose for this patient
                            ({overdose.max.toFixed(0)} mg/day based on {patientData?.weight || 10} kg x {overdose.maxPerKg} {overdose.unit}).
                            Please review and correct the dosage.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Drug notes */}
                    {clinicalInfo?.notes && (
                      <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                        <Info className="size-3 shrink-0 mt-0.5" />
                        <span>{clinicalInfo.notes}</span>
                      </div>
                    )}

                    {/* Instructions */}
                    <div className="mt-3">
                      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block">
                        Special Instructions
                      </Label>
                      <Input
                        placeholder="e.g. After food, with plenty of water..."
                        className="h-9 text-xs"
                        value={row.instructions}
                        onChange={(e) => updateRow(row.id, "instructions", e.target.value)}
                        aria-label="Special instructions"
                      />
                      <VoiceRecorder
                        disabled={isSubmitting || submitted}
                        onTextGenerated={(text) => {
                          setPrescriptions((prev) =>
                            prev.map((item) =>
                              item.id === row.id
                                ? { ...item, instructions: appendTranscript(item.instructions, text) }
                                : item
                            )
                          )
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Action Footer ───────────────────────────────────── */}
      {prescriptions.length > 0 && !submitted && (
        <div className="sticky bottom-0 z-[100] bg-background/95 backdrop-blur-sm border-t border-border -mx-4 lg:-mx-6 px-4 lg:px-6 py-4 mt-auto">
          <div className="flex items-center justify-between flex-wrap gap-3 max-w-[1200px] mx-auto">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="size-3.5" />
              <span>All doses are validated against patient weight ({patientData?.weight || 10} kg). Review drug notes before signing.</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Printer className="size-3.5" />
                Preview
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="size-3.5" />
                Save Draft
              </Button>
              <Button
                size="sm"
                className="gap-1.5 text-xs shadow-md"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                type="button"
              >
                {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                {isSubmitting ? "Submitting..." : "Submit Prescription"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Submitted confirmation */}
      {submitted && (
        <div className="flex items-center gap-3 rounded-lg border-2 border-[#22a06b]/40 bg-[#22a06b]/5 px-5 py-4">
          <CheckCircle2 className="size-6 text-[#22a06b] shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-[#1a7f5a]">Prescription Submitted Successfully</span>
            <span className="text-xs text-foreground">
              {prescriptions.length} medication{prescriptions.length !== 1 ? "s" : ""} prescribed for {patientData?.name} ({patientData?.id}).
              Sent to pharmacy for dispensing.
            </span>
          </div>
        </div>
      )}

      {/* ─── Drug Interaction Dialog ─────────────────────────── */}
      <Dialog open={interactionDialogOpen} onOpenChange={setInteractionDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-5" />
              Drug Interaction Detected
            </DialogTitle>
            <DialogDescription>
              The following potential drug interactions were found in this prescription.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            {pendingInteractions.map((interaction, idx) => (
              <div key={idx} className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-3">
                <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-foreground">
                    {interaction.drugA} + {interaction.drugB}
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    {interaction.reason}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setInteractionDialogOpen(false)}>
              Review Prescription
            </Button>
            <Button variant="destructive" size="sm" onClick={() => {
              setInteractionDialogOpen(false);
              handleSubmit(true);
            }}>
              Acknowledge & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Allergy Conflict Dialog ─────────────────────────── */}
      <Dialog open={allergyDialogOpen} onOpenChange={setAllergyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertOctagon className="size-5" />
              Allergy Conflict - Medication Blocked
            </DialogTitle>
            <DialogDescription>
              This medication cannot be added due to a known patient allergy.
            </DialogDescription>
          </DialogHeader>
          {pendingAllergyConflict && (
            <div className="flex items-start gap-2.5 rounded-lg border-2 border-destructive/40 bg-destructive/5 px-4 py-4">
              <AlertOctagon className="size-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-destructive">
                  {pendingAllergyConflict.drug} is contraindicated
                </span>
                <span className="text-xs text-foreground leading-relaxed">
                  Patient has a documented allergy to <strong>{pendingAllergyConflict.allergy}</strong>.
                  This medication has been blocked from being added to the prescription to prevent a potentially severe adverse reaction.
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button size="sm" onClick={() => setAllergyDialogOpen(false)}>
              Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Click-away overlay for drug search */}
      {showDrugSearch && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => {
            setShowDrugSearch(false)
            setDrugSearchQuery("")
          }}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
