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
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePharmacyInventory, createPrescription } from "@/lib/api/pharmacy"
import { usePatients } from "@/lib/api/patients"
import { useAuthStore } from "@/lib/store/auth-store"
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
const patient = {
  id: "PED-20260189",
  name: "Aarav Sharma",
  dob: "Mar 15, 2023",
  age: "2 years 11 months",
  gender: "Male",
  bloodGroup: "B+",
  weight: 12.5,
  height: "89 cm",
  bsa: "0.56 m\u00B2",
  allergies: ["Sulfonamide", "Ibuprofen"],
  guardian: "Meera Sharma (Mother)",
  phone: "+91 97654 32100",
  diagnosis: "Acute Otitis Media with Moderate Fever",
  doctor: "Dr. Priya Reddy",
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
  drugId: string
  form: string
  dose: string
  frequency: string
  duration: string
  route: string
  instructions: string
}

// ─── Helpers ───────────────────────────────────────────────────
function getDrug(drugId: string) {
  return drugDatabase.find((d) => d.id === drugId)
}

function checkOverdose(drugId: string, doseStr: string, weightKg: number) {
  const drug = getDrug(drugId)
  if (!drug || !doseStr) return null
  const dose = parseFloat(doseStr)
  if (isNaN(dose)) return null
  const maxTotal = drug.maxDosePerKg * weightKg
  if (dose > maxTotal) {
    return {
      entered: dose,
      max: maxTotal,
      maxPerKg: drug.maxDosePerKg,
      unit: drug.unit,
    }
  }
  return null
}

function checkInteractions(prescribedDrugIds: string[]): { drugA: string; drugB: string; reason: string }[] {
  const results: { drugA: string; drugB: string; reason: string }[] = []
  for (let i = 0; i < prescribedDrugIds.length; i++) {
    for (let j = i + 1; j < prescribedDrugIds.length; j++) {
      const drugA = getDrug(prescribedDrugIds[i])
      const drugB = getDrug(prescribedDrugIds[j])
      if (!drugA || !drugB) continue
      if (drugA.interactions.some((x) => drugB.name.toLowerCase().includes(x.toLowerCase()))) {
        results.push({
          drugA: drugA.name,
          drugB: drugB.name,
          reason: `${drugA.name} has a known interaction with ${drugB.name}. Concurrent use may alter efficacy or increase adverse effects.`,
        })
      }
      if (drugB.interactions.some((x) => drugA.name.toLowerCase().includes(x.toLowerCase()))) {
        if (!results.find((r) => r.drugA === drugB.name && r.drugB === drugA.name)) {
          results.push({
            drugA: drugB.name,
            drugB: drugA.name,
            reason: `${drugB.name} has a known interaction with ${drugA.name}. Review dosing and monitor closely.`,
          })
        }
      }
    }
  }
  return results
}

function checkAllergyConflict(drugId: string, allergies: string[]) {
  const drug = getDrug(drugId)
  if (!drug) return null
  for (const allergy of allergies) {
    if (drug.name.toLowerCase().includes(allergy.toLowerCase()) ||
      drug.generic.toLowerCase().includes(allergy.toLowerCase()) ||
      drug.contraindications.some((c) => c.toLowerCase().includes(allergy.toLowerCase()))) {
      return { drug: drug.name, allergy }
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

  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([
    {
      id: 1,
      drugId: "amoxicillin",
      form: "Suspension 250mg/5ml",
      dose: "375",
      frequency: "TID (8-hourly)",
      duration: "7",
      route: "Oral",
      instructions: "After food",
    },
    {
      id: 2,
      drugId: "paracetamol",
      form: "Syrup 120mg/5ml",
      dose: "150",
      frequency: "QID (6-hourly)",
      duration: "5",
      route: "Oral",
      instructions: "For fever > 100.4F. Min 4h gap.",
    },
  ])
  const [nextId, setNextId] = useState(3)
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false)
  const [pendingInteractions, setPendingInteractions] = useState<{ drugA: string; drugB: string; reason: string }[]>([])
  const [allergyDialogOpen, setAllergyDialogOpen] = useState(false)
  const [pendingAllergyConflict, setPendingAllergyConflict] = useState<{ drug: string; allergy: string } | null>(null)
  const [drugSearchQuery, setDrugSearchQuery] = useState("")
  const [showDrugSearch, setShowDrugSearch] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const filteredDrugs = drugSearchQuery.trim()
    ? drugDatabase.filter(
      (d) =>
        d.name.toLowerCase().includes(drugSearchQuery.toLowerCase()) ||
        d.generic.toLowerCase().includes(drugSearchQuery.toLowerCase()) ||
        d.category.toLowerCase().includes(drugSearchQuery.toLowerCase())
    )
    : drugDatabase

  const addDrug = useCallback(
    (drugId: string) => {
      const drug = getDrug(drugId)
      if (!drug) return

      // Allergy check
      const allergyConflict = checkAllergyConflict(drugId, patient.allergies)
      if (allergyConflict) {
        setPendingAllergyConflict(allergyConflict)
        setAllergyDialogOpen(true)
        setShowDrugSearch(false)
        setDrugSearchQuery("")
        return
      }

      // Add the drug
      const newRow: PrescriptionRow = {
        id: nextId,
        drugId,
        form: drug.defaultForm,
        dose: "",
        frequency: drug.defaultFrequency,
        duration: "",
        route: "Oral",
        instructions: "",
      }

      const updatedList = [...prescriptions, newRow]
      setNextId((p) => p + 1)

      // Interaction check
      const allDrugIds = updatedList.map((r) => r.drugId)
      const interactions = checkInteractions(allDrugIds)
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

  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async () => {
    const allDrugIds = prescriptions.map((r) => r.drugId)
    const interactions = checkInteractions(allDrugIds)
    if (interactions.length > 0) {
      setPendingInteractions(interactions)
      setInteractionDialogOpen(true)
      return
    }

    if (!activePatientId && !patientId) {
      toast.error("Valid patient required to send prescription.")
      return
    }

    setIsSaving(true)
    try {
      const itemsPayload = []
      for (const row of prescriptions) {
        // Map to real DB medication using naive start matching
        const dbMed = inventory.find(m => m.drugName.toLowerCase().includes(row.drugId.toLowerCase()) || m.genericName.toLowerCase().includes(row.drugId.toLowerCase()))

        if (!dbMed) {
          toast.error(`Medication for ${row.drugId} not found in Pharmacy. Please alert admin to add it to Data Master.`)
          setIsSaving(false)
          return
        }

        // Basic calculation
        const days = parseInt(row.duration) || 1
        let mult = 1
        const freq = row.frequency.toLowerCase()
        if (freq.includes('bid') || freq.includes('12-hourly')) mult = 2
        if (freq.includes('tid') || freq.includes('8-hourly')) mult = 3
        if (freq.includes('qid') || freq.includes('6-hourly')) mult = 4
        const qty = mult * days

        itemsPayload.push({
          medicationId: dbMed.id,
          prescribedQty: qty > 0 ? qty : 1
        })
      }

      await createPrescription({
        patientId: activePatientId || "6035987a-3ea1-4217-bf24-2794ac1bdeb3", // Fallback to a valid seeded patient if running blind
        doctorId: currentUser?.id || "e1e19488-812e-4e4b-a7e8-1c4912953282", // Fallback default doctor
        notes: prescriptions[0]?.instructions || "Generated from Dashboard",
        items: itemsPayload
      })

      toast.success("Prescription signed and sent to Pharmacy successfully.")
      setSubmitted(true)
    } catch (err: any) {
      toast.error(err.message || "Failed to submit prescription")
    } finally {
      setIsSaving(false)
    }
  }

  // current interactions for display
  const currentInteractions = checkInteractions(prescriptions.map((r) => r.drugId))

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
                    {patient.name}
                  </h1>
                  <Badge variant="secondary" className="text-[11px] font-medium">
                    {patient.id}
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
                    {patient.doctor}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span>Dx: {patient.diagnosis}</span>
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
                <span className="text-2xl font-bold text-foreground mt-0.5">{patient.weight} <span className="text-sm font-medium text-muted-foreground">kg</span></span>
                <span className="text-[10px] text-muted-foreground mt-0.5">BSA: {patient.bsa}</span>
              </div>
            </div>
          </div>

          {/* Allergy Banner */}
          {patient.allergies.length > 0 && (
            <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
              <AlertOctagon className="size-4 text-destructive shrink-0" />
              <span className="text-xs font-semibold text-destructive">KNOWN ALLERGIES:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {patient.allergies.map((a) => (
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
                      filteredDrugs.map((drug) => {
                        const alreadyAdded = prescriptions.some((r) => r.drugId === drug.id)
                        return (
                          <li key={drug.id}>
                            <button
                              className={cn(
                                "w-full text-left px-4 py-2.5 hover:bg-muted/60 transition-colors flex flex-col gap-0.5",
                                alreadyAdded && "opacity-50 pointer-events-none"
                              )}
                              onClick={() => addDrug(drug.id)}
                              disabled={alreadyAdded}
                              role="option"
                              aria-selected={false}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">{drug.name}</span>
                                <Badge variant="secondary" className="text-[10px]">{drug.category}</Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">{drug.generic}</span>
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
                const drug = getDrug(row.drugId)
                if (!drug) return null
                const overdose = checkOverdose(row.drugId, row.dose, patient.weight)
                const allergyConflict = checkAllergyConflict(row.drugId, patient.allergies)

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
                            <span className="text-sm font-semibold text-foreground">{drug.name}</span>
                            <Badge variant="secondary" className="text-[10px]">{drug.category}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">{drug.generic}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeDrug(row.id)}
                        aria-label={`Remove ${drug.name}`}
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
                            {drug.forms.map((f) => (
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
                        <span className="text-[10px] text-muted-foreground">
                          Max: {(drug.maxDosePerKg * patient.weight).toFixed(0)} mg/day ({drug.maxDosePerKg} {drug.unit})
                        </span>
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
                            {drug.frequencies.map((f) => (
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
                            ({overdose.max.toFixed(0)} mg/day based on {patient.weight} kg x {overdose.maxPerKg} {overdose.unit}).
                            Please review and correct the dosage.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Drug notes */}
                    <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                      <Info className="size-3 shrink-0 mt-0.5" />
                      <span>{drug.notes}</span>
                    </div>

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
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="size-3.5" />
            <span>All doses are validated against patient weight ({patient.weight} kg). Review drug notes before signing.</span>
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
              className="gap-1.5 text-xs"
              onClick={handleSubmit}
            >
              <CheckCircle2 className="size-3.5" />
              Submit Prescription
            </Button>
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
              {prescriptions.length} medication{prescriptions.length !== 1 ? "s" : ""} prescribed for {patient.name} ({patient.id}).
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
            <Button variant="destructive" size="sm" onClick={() => setInteractionDialogOpen(false)}>
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
          className="fixed inset-0 z-40"
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
