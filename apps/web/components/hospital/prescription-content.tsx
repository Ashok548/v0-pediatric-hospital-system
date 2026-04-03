"use client"

import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Mic,
  Plus,
  Printer,
  Save,
  ShieldAlert,
} from "lucide-react"
import { toast } from "sonner"

import { PatientHeader } from "@/components/hospital/patient-header-rx"
import {
  InvestigationRow,
  type InvestigationRowData,
  type InvestigationReferenceType,
  type InvestigationSuggestion,
  type InvestigationType,
} from "@/components/hospital/investigation-row"
import {
  PrescriptionRow,
  type PrescriptionDrugSuggestion,
  type PrescriptionRowData,
} from "@/components/hospital/prescription-row"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { usePatientAdmissions } from "@/lib/api/admissions"
import { createLabOrder, useLabMasterProfiles } from "@/lib/api/labs"
import { useAdmissionVitals, usePatientGrowth } from "@/lib/api/nicu"
import type { PaginatedOPVisits } from "@/lib/api/op-visits"
import { type ApiMedication, createPrescription, usePharmacyInventory } from "@/lib/api/pharmacy"
import { usePatient } from "@/lib/api/patients"
import { useServices } from "@/lib/api/services"
import { useAuthStore } from "@/lib/store/auth-store"
import { appendTranscript } from "@/lib/utils/transcript"
import { cn } from "@/lib/utils"
import { useQuery } from "@/hooks/use-query"

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
    notes: "Do not exceed 60mg/kg/day. Minimum interval 4 hours between doses.",
  },
  {
    id: "azithromycin",
    name: "Azithromycin",
    generic: "Azithromycin Dihydrate",
    category: "Antibiotic (Macrolide)",
    forms: ["Suspension 100mg/5ml", "Suspension 200mg/5ml", "Tablet 250mg"],
    defaultForm: "Suspension 200mg/5ml",
    maxDosePerKg: 10,
    unit: "mg/kg/day",
    frequencies: ["OD (once daily)"],
    defaultFrequency: "OD (once daily)",
    contraindications: ["Hepatic dysfunction", "QT prolongation"],
    interactions: ["Amoxicillin", "Warfarin", "Antacids"],
    notes: "Give 1 hour before or 2 hours after meals. Usual course is 3-5 days.",
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
    contraindications: ["Phenylketonuria"],
    interactions: ["Phenobarbital", "Rifampicin"],
    notes: "Administer in the evening. For children 2-5 years: 4mg daily.",
  },
  {
    id: "prednisolone",
    name: "Prednisolone",
    generic: "Prednisolone",
    category: "Corticosteroid",
    forms: ["Syrup 5mg/5ml", "Tablet 5mg", "Tablet 10mg"],
    defaultForm: "Syrup 5mg/5ml",
    maxDosePerKg: 2,
    unit: "mg/kg/day",
    frequencies: ["OD (once daily)", "BID (12-hourly)"],
    defaultFrequency: "OD (once daily)",
    contraindications: ["Systemic fungal infections", "Live vaccines"],
    interactions: ["NSAIDs", "Phenytoin", "Carbamazepine"],
    notes: "Administer with food. Taper dose if used for more than 5 days.",
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
    contraindications: ["QT prolongation"],
    interactions: ["Apomorphine", "Tramadol"],
    notes: "Maximum single dose is 4mg for children under 12 years.",
  },
  {
    id: "salbutamol",
    name: "Salbutamol Inhaler",
    generic: "Salbutamol Sulphate",
    category: "Bronchodilator",
    forms: ["MDI 100mcg/puff", "Nebulisation 2.5mg/2.5ml", "Syrup 2mg/5ml"],
    defaultForm: "MDI 100mcg/puff",
    maxDosePerKg: 0.15,
    unit: "mg/kg/dose",
    frequencies: ["QID (6-hourly)", "PRN (as needed)"],
    defaultFrequency: "QID (6-hourly)",
    contraindications: ["Hypertrophic obstructive cardiomyopathy"],
    interactions: ["Beta-blockers", "Digoxin"],
    notes: "Use with spacer for inhaler delivery in younger children.",
  },
]

const ADVICE_CHIPS = [
  { label: "Hydration", value: "Ensure adequate hydration." },
  { label: "Rest", value: "Ensure adequate rest." },
  { label: "Breastfeeding", value: "Continue breastfeeding as usual." },
  { label: "Steam", value: "Steam inhalation twice daily." },
]

const FOLLOW_UP_OPTIONS = [
  { label: "2 days", value: "2" },
  { label: "3 days", value: "3" },
  { label: "5 days", value: "5" },
  { label: "1 week", value: "7" },
]

const TABLE_COLUMNS = "minmax(220px,2.4fr) minmax(120px,1fr) minmax(170px,1.2fr) minmax(160px,1.1fr) minmax(110px,0.8fr) minmax(220px,1.8fr) 40px"
const INVESTIGATION_TABLE_COLUMNS = "minmax(280px,2fr) minmax(260px,1.5fr) 40px"

function createEmptyRow(): PrescriptionRowData {
  return {
    id: crypto.randomUUID(),
    drugId: "",
    drugName: "",
    genericName: "",
    dose: "",
    frequency: "",
    duration: "",
    route: "Oral",
    instructions: "",
  }
}

function isRowBlank(row: PrescriptionRowData) {
  return !row.drugName && !row.dose && !row.frequency && !row.duration && !row.instructions
}

function ensureTrailingEmptyRow(rows: PrescriptionRowData[]) {
  if (rows.length === 0) return [createEmptyRow()]
  return isRowBlank(rows[rows.length - 1]) ? rows : [...rows, createEmptyRow()]
}

function defaultSampleTypeForInvestigation(type: InvestigationType) {
  return type === "SCAN" ? "Imaging" : "Blood"
}

function createEmptyInvestigationRow(type: InvestigationType): InvestigationRowData {
  return {
    id: crypto.randomUUID(),
    testName: "",
    referenceId: "",
    referenceType: "" as InvestigationReferenceType,
    type,
    sampleType: defaultSampleTypeForInvestigation(type),
    notes: "",
  }
}

function isInvestigationRowBlank(row: InvestigationRowData) {
  return !row.testName && !row.notes
}

function ensureTrailingEmptyInvestigationRow(rows: InvestigationRowData[], type: InvestigationType) {
  if (rows.length === 0) return [createEmptyInvestigationRow(type)]
  return isInvestigationRowBlank(rows[rows.length - 1]) ? rows : [...rows, createEmptyInvestigationRow(type)]
}

function normalizeFrequencyValue(value?: string) {
  if (!value) return ""
  const normalized = value.toLowerCase()
  if (normalized.includes("qid")) return "QID"
  if (normalized.includes("tid") || normalized.includes("tds")) return "TDS"
  if (normalized.includes("bid") || normalized.includes("bd")) return "BD"
  if (normalized.includes("od")) return "OD"
  return ""
}

function parseDurationDays(duration: string) {
  const parsed = Number.parseInt(duration.replace(/\D/g, ""), 10)
  return Number.isNaN(parsed) ? 0 : parsed
}

function dosesPerDay(frequency: string) {
  switch (frequency) {
    case "BD":
      return 2
    case "TDS":
      return 3
    case "QID":
      return 4
    case "OD":
    default:
      return 1
  }
}

function getClinicalDrug(drugName: string, genericName: string) {
  return drugDatabase.find((drug) =>
    drugName.toLowerCase().includes(drug.name.toLowerCase()) ||
    genericName.toLowerCase().includes(drug.generic.toLowerCase()) ||
    drug.generic.toLowerCase().includes(genericName.toLowerCase())
  )
}

function checkAllergyConflict(drugName: string, genericName: string, allergies: string[]) {
  const clinical = getClinicalDrug(drugName, genericName)

  for (const allergy of allergies) {
    const normalizedAllergy = allergy.toLowerCase()
    if (
      drugName.toLowerCase().includes(normalizedAllergy) ||
      genericName.toLowerCase().includes(normalizedAllergy) ||
      clinical?.contraindications.some((entry) => entry.toLowerCase().includes(normalizedAllergy))
    ) {
      return { drug: drugName, allergy }
    }
  }

  return null
}

function checkInteractions(medications: { name: string; generic: string }[]) {
  const results: { drugA: string; drugB: string; reason: string }[] = []

  for (let index = 0; index < medications.length; index++) {
    for (let secondIndex = index + 1; secondIndex < medications.length; secondIndex++) {
      const drugA = getClinicalDrug(medications[index].name, medications[index].generic)
      const drugB = getClinicalDrug(medications[secondIndex].name, medications[secondIndex].generic)
      if (!drugA || !drugB) continue

      if (drugA.interactions.some((item) => drugB.name.toLowerCase().includes(item.toLowerCase()))) {
        results.push({
          drugA: medications[index].name,
          drugB: medications[secondIndex].name,
          reason: `${drugA.name} has a known interaction with ${drugB.name}. Review the combination before signing.`,
        })
      }

      if (drugB.interactions.some((item) => drugA.name.toLowerCase().includes(item.toLowerCase()))) {
        results.push({
          drugA: medications[secondIndex].name,
          drugB: medications[index].name,
          reason: `${drugB.name} may alter the effect of ${drugA.name}. Consider dose review or closer monitoring.`,
        })
      }
    }
  }

  return results.filter(
    (value, index, array) =>
      index === array.findIndex((entry) => entry.drugA === value.drugA && entry.drugB === value.drugB)
  )
}

function checkOverdose(drugName: string, genericName: string, doseStr: string, weightKg: number | null) {
  if (!weightKg) return null
  const clinical = getClinicalDrug(drugName, genericName)
  if (!clinical || !doseStr) return null

  const dose = Number.parseFloat(doseStr)
  if (Number.isNaN(dose)) return null

  const maximum = clinical.maxDosePerKg * weightKg
  if (dose <= maximum) return null

  return {
    entered: dose,
    max: maximum,
    maxPerKg: clinical.maxDosePerKg,
    unit: clinical.unit,
  }
}

function calculatePrescribedQty(row: PrescriptionRowData, medication?: ApiMedication) {
  const days = parseDurationDays(row.duration) || 1
  const totalDoses = days * dosesPerDay(row.frequency)
  if (!medication) return totalDoses

  const enteredDose = Number.parseFloat(row.dose)
  if (Number.isNaN(enteredDose)) return totalDoses

  const form = medication.form.toLowerCase()
  const strength = medication.strength.toLowerCase()
  const isLiquid =
    form.includes("syrup") ||
    form.includes("suspension") ||
    form.includes("drops") ||
    strength.includes("/ml")

  if (isLiquid) {
    const concentrationMatch = medication.strength.match(/(\d+)\s*mg\s*\/\s*(\d+)\s*ml/i)
    if (!concentrationMatch) return totalDoses

    const mgInConcentration = Number.parseFloat(concentrationMatch[1])
    const mlInConcentration = Number.parseFloat(concentrationMatch[2])
    const mlPerDose = (enteredDose / mgInConcentration) * mlInConcentration
    return Math.max(1, Math.ceil(mlPerDose * totalDoses))
  }

  const tabletStrengthMatch = medication.strength.match(/(\d+)\s*mg/i)
  if (!tabletStrengthMatch) return totalDoses

  const mgPerUnit = Number.parseFloat(tabletStrengthMatch[1])
  return Math.max(1, Math.ceil((enteredDose / mgPerUnit) * totalDoses))
}

function resolveWeightKg(
  birthWeight: number | undefined,
  growthRecords: { recordedAt: string; weight: number | null }[],
  vitals: { recordedAt: string; weight?: number }[]
) {
  const measurements = [
    ...growthRecords
      .filter((record) => typeof record.weight === "number")
      .map((record) => ({ value: record.weight as number, recordedAt: record.recordedAt })),
    ...vitals
      .filter((record) => typeof record.weight === "number")
      .map((record) => ({ value: record.weight as number, recordedAt: record.recordedAt })),
  ].sort((left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime())

  if (measurements.length > 0) return measurements[0].value
  return typeof birthWeight === "number" ? birthWeight : null
}

export function PrescriptionContent({ patientId }: { patientId?: string } = {}) {
  const { currentUser } = useAuthStore()
  const { patient, isLoading: patientLoading } = usePatient(patientId || null)
  const { inventory, isLoading: inventoryLoading } = usePharmacyInventory()
  const { profiles: labProfiles, isLoading: labProfilesLoading } = useLabMasterProfiles()
  const { admissions } = usePatientAdmissions(patient?.id)
  const { data: opVisitsResponse } = useQuery<PaginatedOPVisits>(
    patient?.id ? `/op-visits?patientId=${patient.id}` : null
  )
  const opVisits = opVisitsResponse?.data ?? []
  const activeAdmission = useMemo(
    () => admissions.find((entry) => entry.status === "ADMITTED" || entry.status === "BED_ASSIGNED") ?? null,
    [admissions]
  )
  const { vitals } = useAdmissionVitals(
    activeAdmission?.department?.toUpperCase().includes("NICU") ? activeAdmission.id : null
  )
  const { records: growthRecords } = usePatientGrowth(patient?.id ?? null)

  const activeOpVisit = useMemo(() => {
    const sorted = [...opVisits].sort(
      (left, right) => new Date(right.visitDate).getTime() - new Date(left.visitDate).getTime()
    )

    return (
      sorted.find(
        (visit) => !["COMPLETED", "BILLED", "CANCELLED", "CONVERTED_TO_ER"].includes(visit.status)
      ) ?? null
    )
  }, [opVisits])

  const currentWeightKg = useMemo(
    () => resolveWeightKg(patient?.birthWeight, growthRecords, vitals),
    [growthRecords, patient?.birthWeight, vitals]
  )

  const diagnosis = activeAdmission?.initialDiagnosis || activeOpVisit?.notes || "Diagnosis pending"
  const encounterLabel = activeAdmission
    ? `Linked to active admission ${activeAdmission.admissionNumber}`
    : activeOpVisit
      ? `Linked to OP visit ${activeOpVisit.opNumber}`
      : "No active encounter linked"
  const imagingCareType = activeAdmission ? "IP" : activeOpVisit ? "OP" : "BOTH"
  const { services: imagingServices, isLoading: imagingServicesLoading } = useServices({
    category: "IMAGING",
    careType: imagingCareType,
    limit: 150,
  })

  const [rows, setRows] = useState<PrescriptionRowData[]>(() => [createEmptyRow()])
  const [labRows, setLabRows] = useState<InvestigationRowData[]>(() => [createEmptyInvestigationRow("LAB")])
  const [scanRows, setScanRows] = useState<InvestigationRowData[]>(() => [createEmptyInvestigationRow("SCAN")])
  const [advice, setAdvice] = useState("")
  const [followUpDays, setFollowUpDays] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [activeRowId, setActiveRowId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false)
  const [printAfterInteractionOverride, setPrintAfterInteractionOverride] = useState(false)
  const fieldRefs = useRef<Record<string, Record<string, HTMLInputElement | null>>>({})
  const investigationFieldRefs = useRef<Record<string, Record<string, HTMLInputElement | null>>>({})
  const hasAutoFocusedInitialRow = useRef(false)

  useEffect(() => {
    if (hasAutoFocusedInitialRow.current) return

    const firstRowId = rows[0]?.id
    if (!firstRowId) return

    const timer = window.setTimeout(() => {
      fieldRefs.current[firstRowId]?.drug?.focus()
      hasAutoFocusedInitialRow.current = true
    }, 80)

    return () => window.clearTimeout(timer)
  }, [rows])

  const filledRows = useMemo(() => rows.filter((row) => !isRowBlank(row)), [rows])
  const filledLabRows = useMemo(() => labRows.filter((row) => !isInvestigationRowBlank(row)), [labRows])
  const filledScanRows = useMemo(() => scanRows.filter((row) => !isInvestigationRowBlank(row)), [scanRows])
  const filledInvestigationRows = useMemo(
    () => [...filledLabRows, ...filledScanRows],
    [filledLabRows, filledScanRows]
  )
  const interactionWarnings = useMemo(
    () =>
      checkInteractions(
        filledRows
          .filter((row) => row.drugName)
          .map((row) => ({ name: row.drugName, generic: row.genericName }))
      ),
    [filledRows]
  )

  const registerRef = (rowId: string, field: string, element: HTMLInputElement | null) => {
    fieldRefs.current[rowId] ??= {}
    fieldRefs.current[rowId][field] = element
  }

  const focusField = (rowId: string, field: string) => {
    window.setTimeout(() => {
      fieldRefs.current[rowId]?.[field]?.focus()
    }, 40)
  }

  const registerInvestigationRef = (rowId: string, field: string, element: HTMLInputElement | null) => {
    investigationFieldRefs.current[rowId] ??= {}
    investigationFieldRefs.current[rowId][field] = element
  }

  const focusInvestigationField = (rowId: string, field: string) => {
    window.setTimeout(() => {
      investigationFieldRefs.current[rowId]?.[field]?.focus()
    }, 40)
  }

  const handleAddRow = () => {
    setRows((current) => ensureTrailingEmptyRow(current))
  }

  const handleRemoveRow = (rowId: string) => {
    setRows((current) => {
      const next = current.filter((row) => row.id !== rowId)
      return ensureTrailingEmptyRow(next)
    })
  }

  const handleChange = (rowId: string, field: keyof PrescriptionRowData, value: string) => {
    setRows((current) => {
      const next = current.map((row) => {
        if (row.id !== rowId) return row

        if (field === "drugName") {
          return {
            ...row,
            drugName: value,
            drugId: "",
            genericName: "",
          }
        }

        return { ...row, [field]: value }
      })

      const changedRow = next.find((row) => row.id === rowId)
      if (!changedRow) return next

      const isLastRow = next[next.length - 1]?.id === rowId
      if (isLastRow && !isRowBlank(changedRow) && field === "instructions" && value.trim()) {
        return ensureTrailingEmptyRow(next)
      }

      return next
    })
  }

  const handleDrugSelect = (rowId: string, suggestion: PrescriptionDrugSuggestion) => {
    const allergyConflict = checkAllergyConflict(
      suggestion.drugName,
      suggestion.genericName,
      patient?.allergies ?? []
    )

    if (allergyConflict) {
      toast.error(`${allergyConflict.drug} is blocked because of ${allergyConflict.allergy}.`)
      return
    }

    const clinicalDrug = getClinicalDrug(suggestion.drugName, suggestion.genericName)

    setRows((current) => {
      const next = current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              drugId: suggestion.drugId,
              drugName: suggestion.drugName,
              genericName: suggestion.genericName,
              frequency: row.frequency || normalizeFrequencyValue(clinicalDrug?.defaultFrequency),
              route: row.route || "Oral",
            }
          : row
      )

      const selectedLastRow = current[current.length - 1]?.id === rowId
      return selectedLastRow ? ensureTrailingEmptyRow(next) : next
    })

    if (!suggestion.medication) {
      toast.error("This suggestion is not mapped to pharmacy inventory yet, so it cannot be saved.")
    }

    setActiveRowId(rowId)
    focusField(rowId, "dose")
  }

  const updateInvestigationSection = (
    setSectionRows: Dispatch<SetStateAction<InvestigationRowData[]>>,
    sectionType: InvestigationType,
    rowId: string,
    field: keyof InvestigationRowData,
    value: string
  ) => {
    setSectionRows((current) => {
      const next: InvestigationRowData[] = current.map((row): InvestigationRowData => {
        if (row.id !== rowId) return row

        const clearedReference: Pick<InvestigationRowData, "referenceId" | "referenceType"> = {
          referenceId: "",
          referenceType: "",
        }

        if (field === "testName") {
          return {
            ...row,
            testName: value,
            ...clearedReference,
            sampleType: row.sampleType || defaultSampleTypeForInvestigation(sectionType),
          }
        }

        return { ...row, [field]: value } as InvestigationRowData
      })

      const changedRow = next.find((row) => row.id === rowId)
      if (!changedRow) return next

      const isLastRow = next[next.length - 1]?.id === rowId
      if (isLastRow && !isInvestigationRowBlank(changedRow) && field === "notes" && value.trim()) {
        return ensureTrailingEmptyInvestigationRow(next, sectionType)
      }

      return next
    })
  }

  const selectInvestigationSuggestion = (
    setSectionRows: Dispatch<SetStateAction<InvestigationRowData[]>>,
    sectionType: InvestigationType,
    rowId: string,
    suggestion: InvestigationSuggestion
  ) => {
    setSectionRows((current) => {
      const next = current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              testName: suggestion.testName,
              referenceId: suggestion.referenceId,
              referenceType: suggestion.referenceType,
              type: sectionType,
              sampleType: suggestion.sampleType,
            }
          : row
      )

      const selectedLastRow = current[current.length - 1]?.id === rowId
      return selectedLastRow ? ensureTrailingEmptyInvestigationRow(next, sectionType) : next
    })

    focusInvestigationField(rowId, "notes")
  }

  const handleInvestigationSectionKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    sectionRows: InvestigationRowData[],
    setSectionRows: Dispatch<SetStateAction<InvestigationRowData[]>>,
    sectionType: InvestigationType,
    rowId: string,
    field: string
  ) => {
    if (event.key !== "Enter") return

    event.preventDefault()

    const fieldOrder = ["test", "notes"]
    const rowIndex = sectionRows.findIndex((row) => row.id === rowId)
    const fieldIndex = fieldOrder.indexOf(field)

    if (fieldIndex === -1) return
    if (fieldIndex < fieldOrder.length - 1) {
      focusInvestigationField(rowId, fieldOrder[fieldIndex + 1])
      return
    }

    const nextRow = sectionRows[rowIndex + 1]
    if (nextRow) {
      focusInvestigationField(nextRow.id, "test")
      return
    }

    setSectionRows((current) => {
      const next = ensureTrailingEmptyInvestigationRow(current, sectionType)
      const appendedRow = next[next.length - 1]
      focusInvestigationField(appendedRow.id, "test")
      return next
    })
  }

  const handleAddLabRow = () => {
    setLabRows((current) => ensureTrailingEmptyInvestigationRow(current, "LAB"))
  }

  const handleAddScanRow = () => {
    setScanRows((current) => ensureTrailingEmptyInvestigationRow(current, "SCAN"))
  }

  const handleRemoveLabRow = (rowId: string) => {
    setLabRows((current) => {
      const next = current.filter((row) => row.id !== rowId)
      return ensureTrailingEmptyInvestigationRow(next, "LAB")
    })
  }

  const handleRemoveScanRow = (rowId: string) => {
    setScanRows((current) => {
      const next = current.filter((row) => row.id !== rowId)
      return ensureTrailingEmptyInvestigationRow(next, "SCAN")
    })
  }

  const handleLabInvestigationChange = (
    rowId: string,
    field: keyof InvestigationRowData,
    value: string
  ) => {
    updateInvestigationSection(setLabRows, "LAB", rowId, field, value)
  }

  const handleScanInvestigationChange = (
    rowId: string,
    field: keyof InvestigationRowData,
    value: string
  ) => {
    updateInvestigationSection(setScanRows, "SCAN", rowId, field, value)
  }

  const handleLabInvestigationSelect = (rowId: string, suggestion: InvestigationSuggestion) => {
    selectInvestigationSuggestion(setLabRows, "LAB", rowId, suggestion)
  }

  const handleScanInvestigationSelect = (rowId: string, suggestion: InvestigationSuggestion) => {
    selectInvestigationSuggestion(setScanRows, "SCAN", rowId, suggestion)
  }

  const handleFieldKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    rowId: string,
    field: string
  ) => {
    if (event.key !== "Enter") return

    event.preventDefault()

    const fieldOrder = ["drug", "dose", "instructions"]
    const rowIndex = rows.findIndex((row) => row.id === rowId)
    const fieldIndex = fieldOrder.indexOf(field)

    if (fieldIndex === -1) return
    if (fieldIndex < fieldOrder.length - 1) {
      focusField(rowId, fieldOrder[fieldIndex + 1])
      return
    }

    const nextRow = rows[rowIndex + 1]
    if (nextRow) {
      focusField(nextRow.id, "drug")
      return
    }

    setRows((current) => {
      const next = ensureTrailingEmptyRow(current)
      const appendedRow = next[next.length - 1]
      focusField(appendedRow.id, "drug")
      return next
    })
  }

  const handleDictatePrescription = () => {
    const targetRow = rows.find((row) => row.id === activeRowId) ?? filledRows[filledRows.length - 1] ?? rows[0]
    if (!targetRow) return

    const generated = targetRow.drugName
      ? `Give ${targetRow.drugName} as prescribed. Continue fluids and return if symptoms worsen.`
      : "After food. Encourage fluids, rest, and review if fever persists."

    setRows((current) =>
      current.map((row) =>
        row.id === targetRow.id
          ? { ...row, instructions: appendTranscript(row.instructions, generated) }
          : row
      )
    )
    setActiveRowId(targetRow.id)
    toast.success("Dictation inserted into the active row.")
    focusField(targetRow.id, "instructions")
  }

  const handleSave = async (printAfterSave = false, allowInteractionOverride = false) => {
    if (!patientId || !patient) {
      toast.error("Patient context is missing.")
      return
    }

    if (!currentUser?.id) {
      toast.error("Doctor login is required to save prescriptions.")
      return
    }

    const medicationRowsToSave = rows.filter((row) => row.drugName || row.dose || row.instructions)
    const investigationsToSave = [...labRows, ...scanRows].filter((row) => row.testName || row.notes)

    if (medicationRowsToSave.length === 0 && investigationsToSave.length === 0) {
      toast.error("Add at least one medication or investigation.")
      return
    }

    const incompleteRows = medicationRowsToSave.filter((row) => !row.drugId)
    if (incompleteRows.length > 0) {
      toast.error("Every medication row must be selected from pharmacy inventory before saving.")
      return
    }

    if (!activeAdmission?.id && !activeOpVisit?.id) {
      toast.error("No active admission or outpatient visit is available for this prescription.")
      return
    }

    if (interactionWarnings.length > 0 && !allowInteractionOverride) {
      setPrintAfterInteractionOverride(printAfterSave)
      setInteractionDialogOpen(true)
      return
    }

    setIsSubmitting(true)

    try {
      const saveOperations: Promise<unknown>[] = []

      if (medicationRowsToSave.length > 0) {
        saveOperations.push(
          createPrescription({
            patientId,
            doctorId: currentUser.id,
            admissionId: activeAdmission?.id || undefined,
            opVisitId: activeAdmission ? undefined : activeOpVisit?.id || undefined,
            notes: notes || undefined,
            advice: advice || undefined,
            followUpDays: followUpDays ? Number.parseInt(followUpDays, 10) : undefined,
            items: medicationRowsToSave.map((row) => {
              const medication = inventory.find((item) => item.id === row.drugId)
              return {
                medicationId: row.drugId,
                prescribedQty: calculatePrescribedQty(row, medication),
                dose: row.dose || undefined,
                frequency: row.frequency || undefined,
                duration: parseDurationDays(row.duration) || undefined,
                route: row.route || undefined,
                instructions: row.instructions || undefined,
              }
            }),
          })
        )
      }

      if (investigationsToSave.length > 0) {
        const technicianNotes = investigationsToSave
          .filter((row) => row.notes.trim())
          .map((row) => `${row.testName}: ${row.notes.trim()}`)
          .join("\n")

        saveOperations.push(
          createLabOrder({
            patientId,
            admissionId: activeAdmission?.id || undefined,
            opVisitId: activeAdmission ? undefined : activeOpVisit?.id || undefined,
            panels: investigationsToSave.map((row) => ({
              panelName: row.testName,
              category: row.type === "SCAN" ? "IMAGING" : "LAB",
              sampleType: row.sampleType || defaultSampleTypeForInvestigation(row.type),
              testProfileId:
                row.referenceType === "LAB_PROFILE" && row.referenceId ? row.referenceId : undefined,
            })),
            technicianNotes: technicianNotes || undefined,
          })
        )
      }

      await Promise.all(saveOperations)
      setSubmitted(true)
      toast.success("Prescription saved successfully.")

      if (printAfterSave) {
        window.setTimeout(() => window.print(), 80)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save prescription.")
    } finally {
      setIsSubmitting(false)
      setInteractionDialogOpen(false)
    }
  }

  if (patientLoading || !patient) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const usedDrugIds = rows.filter((row) => row.drugId).map((row) => row.drugId)
  const usedDrugNames = rows.filter((row) => row.drugName).map((row) => row.drugName.toLowerCase())
  const readyMedicationCount = filledRows.filter((row) => row.drugId).length
  const readyInvestigationCount = filledInvestigationRows.length

  return (
    <div className="mx-auto flex max-w-[1360px] flex-col gap-5 p-4 lg:p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={patientId ? `/patients/${patientId}` : "/patients"}
          className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {patientId ? "Patient" : "Patients"}
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">Prescription Entry</span>
      </div>

      <PatientHeader
        patient={patient}
        diagnosis={diagnosis}
        doctorName={currentUser?.name || "Attending doctor"}
        weightKg={currentWeightKg}
      />

      <div className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
        <span className="font-semibold text-foreground">Encounter:</span> {encounterLabel}
        {!currentWeightKg && (
          <span className="ml-3 inline-flex items-center gap-1.5 text-amber-700">
            <AlertTriangle className="size-4" />
            Current weight is missing, so overdose checks are limited.
          </span>
        )}
      </div>

      {interactionWarnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
          <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-amber-800">
            <ShieldAlert className="size-4" />
            Drug interaction warning
          </div>
          <div className="space-y-1.5 text-sm text-amber-900">
            {interactionWarnings.map((warning, index) => (
              <div key={`${warning.drugA}-${warning.drugB}-${index}`}>
                <span className="font-medium">{warning.drugA}</span> + <span className="font-medium">{warning.drugB}</span>: {warning.reason}
              </div>
            ))}
          </div>
        </div>
      )}

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/70 bg-slate-50/60">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">Prescription</CardTitle>
            <CardDescription>
              Keyboard-first entry with inline search, dosing checks, and one ready row at all times.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[1120px]">
              <div
                className="grid gap-3 border-b border-border/70 bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                style={{ gridTemplateColumns: TABLE_COLUMNS }}
              >
                <div>Drug</div>
                <div>Dose</div>
                <div>Frequency</div>
                <div>Duration</div>
                <div>Route</div>
                <div>Instructions</div>
                <div />
              </div>

              {rows.map((row, index) => {
                const clinicalDrug = getClinicalDrug(row.drugName, row.genericName)
                const overdose = checkOverdose(row.drugName, row.genericName, row.dose, currentWeightKg)

                return (
                  <PrescriptionRow
                    key={row.id}
                    row={row}
                    index={index}
                    inventory={inventory}
                    isLast={index === rows.length - 1}
                    usedDrugIds={usedDrugIds}
                    usedDrugNames={usedDrugNames}
                    onChange={handleChange}
                    onDrugSelect={handleDrugSelect}
                    onRemove={handleRemoveRow}
                    onFocusRow={setActiveRowId}
                    registerRef={registerRef}
                    onFieldKeyDown={handleFieldKeyDown}
                    inventoryMissing={!!row.drugName && !row.drugId}
                    note={clinicalDrug?.notes || null}
                    overdoseMessage={
                      overdose
                        ? `Entered dose ${overdose.entered} exceeds the safe limit of ${overdose.max.toFixed(0)} based on ${currentWeightKg?.toFixed(1)} kg and ${overdose.maxPerKg} ${overdose.unit}.`
                        : null
                    }
                  />
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 bg-background px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" className="gap-2" onClick={handleAddRow}>
                <Plus className="size-4" />
                Add Row
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={handleDictatePrescription}
                disabled={submitted}
              >
                <Mic className="size-4" />
                Dictate Prescription
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              {inventoryLoading ? "Loading pharmacy inventory..." : `${inventory.length} medicines available from inventory`}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/70 bg-slate-50/60">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">Investigations</CardTitle>
            <CardDescription>
              Add lab tests and scans in the same visit flow, with one ready row at all times.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="border-b border-border/70">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/25 px-4 py-4">
                  <div>
                    <div className="text-sm font-semibold text-foreground">Lab</div>
                    <div className="text-xs text-muted-foreground">Order lab investigations from the test catalog.</div>
                  </div>
                  <Button type="button" variant="outline" className="gap-2" onClick={handleAddLabRow}>
                    <Plus className="size-4" />
                    Add Lab Test
                  </Button>
                </div>
                <div
                  className="grid gap-3 border-t border-border/70 bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                  style={{ gridTemplateColumns: INVESTIGATION_TABLE_COLUMNS }}
                >
                  <div>Test Name</div>
                  <div>Notes</div>
                  <div />
                </div>
                {labRows.map((row, index) => (
                  <InvestigationRow
                    key={row.id}
                    row={row}
                    index={index}
                    profiles={labProfiles}
                    imagingServices={imagingServices}
                    sectionType="LAB"
                    isLast={index === labRows.length - 1}
                    onChange={handleLabInvestigationChange}
                    onSelect={handleLabInvestigationSelect}
                    onRemove={handleRemoveLabRow}
                    onFocusRow={setActiveRowId}
                    registerRef={registerInvestigationRef}
                    onFieldKeyDown={(event, rowId, field) =>
                      handleInvestigationSectionKeyDown(event, labRows, setLabRows, "LAB", rowId, field)
                    }
                  />
                ))}
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/25 px-4 py-4">
                  <div>
                    <div className="text-sm font-semibold text-foreground">Scan</div>
                    <div className="text-xs text-muted-foreground">Order scans from the imaging service catalog.</div>
                  </div>
                  <Button type="button" variant="outline" className="gap-2" onClick={handleAddScanRow}>
                    <Plus className="size-4" />
                    Add Scan
                  </Button>
                </div>
                <div
                  className="grid gap-3 border-t border-border/70 bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                  style={{ gridTemplateColumns: INVESTIGATION_TABLE_COLUMNS }}
                >
                  <div>Test Name</div>
                  <div>Notes</div>
                  <div />
                </div>
                {scanRows.map((row, index) => (
                  <InvestigationRow
                    key={row.id}
                    row={row}
                    index={index}
                    profiles={labProfiles}
                    imagingServices={imagingServices}
                    sectionType="SCAN"
                    isLast={index === scanRows.length - 1}
                    onChange={handleScanInvestigationChange}
                    onSelect={handleScanInvestigationSelect}
                    onRemove={handleRemoveScanRow}
                    onFocusRow={setActiveRowId}
                    registerRef={registerInvestigationRef}
                    onFieldKeyDown={(event, rowId, field) =>
                      handleInvestigationSectionKeyDown(event, scanRows, setScanRows, "SCAN", rowId, field)
                    }
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 bg-background px-4 py-4">
            <div className="text-xs text-muted-foreground">
              {labProfilesLoading || imagingServicesLoading
                ? "Loading investigation catalogs..."
                : `${labProfiles.length} lab profile(s), ${imagingServices.length} imaging service(s) available`}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Advice</CardTitle>
          <CardDescription>Tap common guidance to append it, then edit freely.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {ADVICE_CHIPS.map((chip) => {
              const selected = advice.includes(chip.value)
              return (
                <button
                  key={chip.label}
                  type="button"
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => setAdvice((current) => appendTranscript(current, chip.value))}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>
          <Textarea
            value={advice}
            onChange={(event) => setAdvice(event.target.value)}
            placeholder="Diet, hydration, home care, warning signs..."
            className="min-h-28"
          />
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Follow-up</CardTitle>
            <CardDescription>Choose a quick follow-up interval.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={followUpDays} onValueChange={setFollowUpDays}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select follow-up" />
              </SelectTrigger>
              <SelectContent>
                {FOLLOW_UP_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
            <CardDescription>Internal notes for the prescription and pharmacy handoff.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Clinical notes, escalation guidance, monitoring points..."
              className="min-h-28"
            />
          </CardContent>
        </Card>
      </div>

      {submitted && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
          Prescription saved. Orders are now linked to the current encounter.
        </div>
      )}

      <div className="sticky bottom-0 z-20 -mx-4 border-t border-border/70 bg-background/95 px-4 py-4 backdrop-blur lg:-mx-6 lg:px-6">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {readyMedicationCount} medication row(s), {readyInvestigationCount} investigation row(s) ready to save
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={isSubmitting || submitted}
              onClick={() => void handleSave(false)}
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save
            </Button>
            <Button
              type="button"
              className="gap-2"
              disabled={isSubmitting || submitted}
              onClick={() => void handleSave(true)}
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
              Save & Print
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={interactionDialogOpen} onOpenChange={setInteractionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-800">
              <ShieldAlert className="size-5" />
              Review drug interactions
            </DialogTitle>
            <DialogDescription>
              Potential interactions were detected in this prescription. Review them before you continue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {interactionWarnings.map((warning, index) => (
              <div key={`${warning.drugA}-${warning.drugB}-${index}`} className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                <div className="font-medium">
                  {warning.drugA} + {warning.drugB}
                </div>
                <div className="mt-1 text-amber-800">{warning.reason}</div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setInteractionDialogOpen(false)}>
              Review Rows
            </Button>
            <Button type="button" onClick={() => void handleSave(printAfterInteractionOverride, true)}>
              Continue Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}