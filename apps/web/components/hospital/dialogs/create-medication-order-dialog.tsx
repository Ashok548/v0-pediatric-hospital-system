// apps/web/components/hospital/dialogs/create-medication-order-dialog.tsx
"use client"

import React, { useState, useCallback } from "react"
import { useSWRConfig } from "swr"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, Building2, Stethoscope, Search, Trash2, Pill, ShieldAlert, XCircle, AlertOctagon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
// SWR dependencies
import { usePharmacyInventory, createPrescription } from "@/lib/api/pharmacy"
import { usePatient } from "@/lib/api/patients"
import { useAuthStore } from "@/lib/store/auth-store"

// --- Subset of Drug Logic ---
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

function getClinicalDrug(drugName: string, genericName: string) {
    return drugDatabase.find((d) =>
        drugName.toLowerCase().includes(d.name.toLowerCase()) ||
        d.generic.toLowerCase().includes(genericName.toLowerCase()) ||
        genericName.toLowerCase().includes(d.generic.toLowerCase())
    )
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

interface PrescriptionRow {
    id: number
    drugId: string
    drugName: string
    genericName: string
    form: string
    dose: string
    frequency: string
    duration: string
    route: string
    instructions: string
}

interface CreateMedicationOrderDialogProps {
    patientId: string
    admissionId?: string | null
    appointmentId?: string | null
    trigger?: React.ReactNode
    onSuccess?: () => void
}

export function CreateMedicationOrderDialog({
    patientId,
    admissionId,
    appointmentId,
    trigger,
    onSuccess,
}: CreateMedicationOrderDialogProps) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([])
    const [nextId, setNextId] = useState(1)
    
    const [drugSearchQuery, setDrugSearchQuery] = useState("")
    const [showDrugSearch, setShowDrugSearch] = useState(false)
    const [notes, setNotes] = useState("")

    const { inventory } = usePharmacyInventory()
    const { mutate } = useSWRConfig()
    const { toast } = useToast()

    const contextType = admissionId ? "INPATIENT" : appointmentId ? "OUTPATIENT" : "NONE"

    const filteredDrugs = (drugSearchQuery.trim()
        ? inventory.filter(
            (m) =>
                m.drugName.toLowerCase().includes(drugSearchQuery.toLowerCase()) ||
                m.genericName.toLowerCase().includes(drugSearchQuery.toLowerCase())
        )
        : inventory).filter(m => m.status !== 'INACTIVE')

    const addDrug = useCallback((medicationId: string) => {
        const dbMed = inventory.find(m => m.id === medicationId)
        if (!dbMed) return

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

        setPrescriptions(prev => [...prev, newRow])
        setNextId(p => p + 1)
        setShowDrugSearch(false)
        setDrugSearchQuery("")
    }, [inventory, nextId])

    const removeDrug = useCallback((id: number) => {
        setPrescriptions(prev => prev.filter(r => r.id !== id))
    }, [])

    const updateRow = useCallback((id: number, field: keyof PrescriptionRow, value: string) => {
        setPrescriptions((prev) =>
            prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
        )
    }, [])

    const handleSubmit = async () => {
        if (prescriptions.length === 0) {
            toast({ title: "Validation Error", description: "Select at least one medication.", variant: "destructive" })
            return
        }

        const interactions = checkInteractions(prescriptions.map((r) => ({ name: r.drugName, generic: r.genericName })))
        if (interactions.length > 0) {
            toast({ title: "Interaction Warning", description: `Detected ${interactions.length} potential interaction(s). Please review.`, variant: "destructive" })
            // Soft block for now, user can correct it or in a real system override it. For this simplified dialog we just warn.
        }

        setIsSubmitting(true)
        try {
            const itemsPayload = prescriptions.map(row => {
                const dbMed = inventory.find(m => m.id === row.drugId)
                
                // Intelligently calculate qty roughly
                const days = parseInt(row.duration) || 1
                let dosesPerDay = 1
                const freq = row.frequency.toLowerCase()
                if (freq.includes('bid') || freq.includes('12-hourly')) dosesPerDay = 2
                if (freq.includes('tid') || freq.includes('8-hourly')) dosesPerDay = 3
                if (freq.includes('qid') || freq.includes('6-hourly')) dosesPerDay = 4
                
                let qty = dosesPerDay * days
                // simplified mapping for demo purposes, assume 1 pill/dose if unintelligent
                
                return {
                    medicationId: row.drugId,
                    prescribedQty: qty,
                    dose: row.dose,
                    frequency: row.frequency,
                    duration: days,
                    instructions: row.instructions || notes
                }
            })

            await createPrescription({
                patientId,
                admissionId: admissionId || undefined,
                appointmentId: appointmentId || undefined,
                notes: notes,
                items: itemsPayload
            })

            toast({ title: "Success", description: "Medication order created successfully." })
            setOpen(false)
            setPrescriptions([])
            setNotes("")
            
            // Revalidate data
            mutate(`/pharmacy/prescriptions`)
            if (patientId) mutate(`/pharmacy/prescriptions?patientId=${patientId}`)
            if (admissionId) mutate(`/pharmacy/prescriptions?admissionId=${admissionId}`)

            onSuccess?.()
        } catch (error: any) {
            toast({ title: "Failed to create order", description: error.message, variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }

    const currentInteractions = checkInteractions(prescriptions.map((r) => ({ name: r.drugName, generic: r.genericName })))

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button size="sm"><Plus className="size-4 mr-2" /> Order Medication</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-4 border-b shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        Order Medication (Prescription)
                        {contextType === "INPATIENT" && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 ml-2">
                                <Building2 className="size-3 mr-1" /> IP
                            </Badge>
                        )}
                        {contextType === "OUTPATIENT" && (
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 ml-2">
                                <Stethoscope className="size-3 mr-1" /> OP
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Search for medications and specify dosages to create a prescription.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-4">
                    {/* Add Drug Button */}
                    <div className="relative z-50">
                        <Button
                            size="sm"
                            className="gap-1.5 text-xs w-fit"
                            onClick={() => setShowDrugSearch(!showDrugSearch)}
                        >
                            <Plus className="size-3.5" />
                            Add Medicine
                        </Button>

                        {showDrugSearch && (
                            <div className="absolute left-0 top-full mt-2 w-80 rounded-lg border border-border bg-card shadow-lg">
                                <div className="p-3 border-b border-border">
                                    <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                                        <Search className="size-4 text-muted-foreground shrink-0" />
                                        <input
                                            type="text"
                                            placeholder="Search medicine name..."
                                            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
                                            value={drugSearchQuery}
                                            onChange={(e) => setDrugSearchQuery(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <ul className="max-h-64 overflow-y-auto py-1">
                                    {filteredDrugs.length === 0 ? (
                                        <li className="px-4 py-6 text-center text-sm text-muted-foreground">No medicines found</li>
                                    ) : (
                                        filteredDrugs.map((med) => {
                                            const alreadyAdded = prescriptions.some((r) => r.drugId === med.id)
                                            return (
                                                <li key={med.id}>
                                                    <button
                                                        className={cn(
                                                            "w-full text-left px-4 py-2.5 hover:bg-muted/60 flex flex-col gap-0.5",
                                                            alreadyAdded && "opacity-50 pointer-events-none"
                                                        )}
                                                        onClick={() => addDrug(med.id)}
                                                    >
                                                        <span className="text-sm font-medium">{med.drugName}</span>
                                                        <span className="text-xs text-muted-foreground">{med.genericName} • {med.form}</span>
                                                    </button>
                                                </li>
                                            )
                                        })
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Interactions Alert */}
                    {currentInteractions.length > 0 && (
                        <div className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 shrink-0">
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="size-5 text-destructive shrink-0" />
                                <span className="text-sm font-bold text-destructive">Drug Interaction Warning</span>
                            </div>
                            {currentInteractions.map((interaction, idx) => (
                                <div key={idx} className="flex items-start gap-2 ml-7 text-xs text-foreground">
                                    <XCircle className="size-3.5 text-destructive shrink-0 mt-0.5" />
                                    <span>
                                        <strong>{interaction.drugA}</strong> + <strong>{interaction.drugB}</strong>: {interaction.reason}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Prescription List */}
                    {prescriptions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 border rounded-lg bg-muted/20">
                            <Pill className="size-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">No medications added yet</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {prescriptions.map((row, idx) => {
                                const clinicalInfo = getClinicalDrug(row.drugName, row.genericName)
                                const forms = clinicalInfo?.forms || [row.form]
                                const frequencies = clinicalInfo?.frequencies || ["OD (once daily)", "BID (12-hourly)", "TID (8-hourly)", "QID (6-hourly)", "PRN (as needed)"]
                                
                                return (
                                    <div key={row.id} className="border rounded-lg p-4 bg-card flex flex-col gap-3 shadow-sm">
                                        <div className="flex items-center gap-3 justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center justify-center size-6 rounded bg-primary/10 text-primary text-xs font-bold">{idx + 1}</span>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold">{row.drugName}</span>
                                                    <span className="text-xs text-muted-foreground">{row.genericName}</span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeDrug(row.id)}>
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="flex flex-col gap-1.5">
                                                <Label className="text-[10px] uppercase text-muted-foreground">Form</Label>
                                                <Select value={row.form} onValueChange={v => updateRow(row.id, "form", v)}>
                                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {forms.map(f => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <Label className="text-[10px] uppercase text-muted-foreground">Dose (mg)</Label>
                                                <Input className="h-8 text-xs" type="number" placeholder="e.g. 250" value={row.dose} onChange={e => updateRow(row.id, "dose", e.target.value)} />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <Label className="text-[10px] uppercase text-muted-foreground">Frequency</Label>
                                                <Select value={row.frequency} onValueChange={v => updateRow(row.id, "frequency", v)}>
                                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {frequencies.map(f => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <Label className="text-[10px] uppercase text-muted-foreground">Duration (Days)</Label>
                                                <Input className="h-8 text-xs" type="number" placeholder="e.g. 5" value={row.duration} onChange={e => updateRow(row.id, "duration", e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t shrink-0">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || prescriptions.length === 0}>
                        {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                        Send to Pharmacy
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
