"use client"

import { useState } from "react"
import { useAdmissionStore, type DischargeClearance } from "@/lib/store/admission-store"
import { DischargeType, type Admission } from "@/lib/data/admissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Circle, Clock, Stethoscope, Pill, CreditCard, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface StepConfig {
    id: string
    label: string
    icon: React.ReactNode
    description: string
}

const STEPS: StepConfig[] = [
    { id: "clinical", label: "Clinical Clearance", icon: <Stethoscope className="h-5 w-5" />, description: "Doctor confirms patient is clinically ready for discharge" },
    { id: "pharmacy", label: "Pharmacy Clearance", icon: <Pill className="h-5 w-5" />, description: "Pharmacist confirms no pending medications" },
    { id: "billing", label: "Billing Clearance", icon: <CreditCard className="h-5 w-5" />, description: "Billing confirms all dues settled" },
    { id: "finalize", label: "Finalize Discharge", icon: <LogOut className="h-5 w-5" />, description: "Complete discharge with type and summary" },
]

function getActiveStep(dc: DischargeClearance): number {
    if (!dc.clinicalCleared) return 0
    if (!dc.pharmacyCleared) return 1
    if (!dc.billingCleared) return 2
    if (dc.status !== "completed") return 3
    return 4 // all done
}

interface Props { admission: Admission; onDone?: () => void }

export function DischargeClearanceStepper({ admission, onDone }: Props) {
    const {
        initiateDischargeClearance,
        setClinicalClearance,
        setPharmacyClearance,
        setBillingClearance,
        finalizeDischarge,
    } = useAdmissionStore()

    const [clinicalNote, setClinicalNote] = useState("")
    const [clinicalBy, setClinicalBy] = useState("")
    const [pharmacyBy, setPharmacyBy] = useState("")
    const [billingBy, setBillingBy] = useState("")
    const [dischargeType, setDischargeType] = useState<DischargeType>(DischargeType.NORMAL)
    const [finalSummary, setFinalSummary] = useState("")
    const [finalBy, setFinalBy] = useState("")

    const dc: DischargeClearance | null = admission.discharge as DischargeClearance | null
    const hasStarted = dc && dc.clinicalCleared !== undefined

    if (!hasStarted) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Clock className="h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">Discharge not yet initiated</p>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                    Initiating discharge will start the multi-department clearance workflow.
                </p>
                <Button onClick={() => { initiateDischargeClearance(admission.id); toast.info("Discharge clearance initiated") }}>
                    Initiate Discharge Clearance
                </Button>
            </div>
        )
    }

    const activeStep = getActiveStep(dc)
    const isComplete = dc.status === "completed"

    return (
        <div className="space-y-6">
            {/* Stepper */}
            <div className="flex items-center gap-0">
                {STEPS.map((step, idx) => {
                    const done = activeStep > idx
                    const active = activeStep === idx && !isComplete
                    return (
                        <div key={step.id} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center gap-1.5 min-w-[60px]">
                                <div className={cn(
                                    "flex items-center justify-center rounded-full w-10 h-10 border-2 transition-colors",
                                    done ? "bg-green-500 border-green-500 text-white" :
                                        active ? "border-primary bg-primary/10 text-primary" :
                                            "border-muted-foreground/30 text-muted-foreground bg-muted"
                                )}>
                                    {done ? <CheckCircle className="h-5 w-5" /> : step.icon}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-medium text-center leading-tight max-w-[64px]",
                                    done ? "text-green-600" : active ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {step.label}
                                </span>
                            </div>
                            {idx < STEPS.length - 1 && (
                                <div className={cn("h-0.5 flex-1 -mt-6 mx-1", done ? "bg-green-400" : "bg-muted-foreground/20")} />
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Completed */}
            {isComplete && (
                <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                    <CardContent className="pt-5 text-center space-y-2">
                        <CheckCircle className="h-10 w-10 mx-auto text-green-600" />
                        <p className="font-semibold text-green-800 dark:text-green-300 text-lg">Patient Discharged</p>
                        <p className="text-sm text-muted-foreground">{dc.finalSummary}</p>
                        <p className="text-xs text-muted-foreground">Type: {dc.type} · By: {/* finalizedBy not stored yet */} </p>
                    </CardContent>
                </Card>
            )}

            {/* Step 0: Clinical */}
            {!isComplete && activeStep === 0 && (
                <Card>
                    <CardContent className="pt-5 space-y-4">
                        <div>
                            <p className="font-medium">Clinical Clearance</p>
                            <p className="text-sm text-muted-foreground">Confirm patient is clinically stable and ready for discharge.</p>
                        </div>
                        <div className="grid gap-3">
                            <div className="space-y-1">
                                <Label>Doctor Name</Label>
                                <Input value={clinicalBy} onChange={e => setClinicalBy(e.target.value)} placeholder="e.g. Dr. Priya Reddy" />
                            </div>
                            <div className="space-y-1">
                                <Label>Clinical Discharge Note</Label>
                                <Textarea
                                    value={clinicalNote}
                                    onChange={e => setClinicalNote(e.target.value)}
                                    placeholder="Condition stable, treatment complete..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <Button
                            disabled={!clinicalNote || !clinicalBy}
                            onClick={() => {
                                setClinicalClearance(admission.id, clinicalNote, clinicalBy)
                                toast.success("Clinical clearance granted")
                            }}
                            className="gap-2"
                        >
                            <CheckCircle className="h-4 w-4" /> Grant Clinical Clearance
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Step 1: Pharmacy */}
            {!isComplete && activeStep === 1 && (
                <Card>
                    <CardContent className="pt-5 space-y-4">
                        <div>
                            <p className="font-medium">Pharmacy Clearance</p>
                            <p className="text-sm text-muted-foreground">Confirm no pending medications or returns for this patient.</p>
                        </div>
                        <div className="space-y-1">
                            <Label>Pharmacist Name</Label>
                            <Input value={pharmacyBy} onChange={e => setPharmacyBy(e.target.value)} placeholder="e.g. Pharmacist Suresh" />
                        </div>
                        <div className="text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-md px-3 py-2.5">
                            ✓ All prescriptions have been verified as dispensed or cancelled.
                        </div>
                        <Button
                            disabled={!pharmacyBy}
                            onClick={() => {
                                setPharmacyClearance(admission.id, pharmacyBy)
                                toast.success("Pharmacy clearance granted")
                            }}
                            className="gap-2"
                        >
                            <CheckCircle className="h-4 w-4" /> Grant Pharmacy Clearance
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Billing */}
            {!isComplete && activeStep === 2 && (
                <Card>
                    <CardContent className="pt-5 space-y-4">
                        <div>
                            <p className="font-medium">Billing Clearance</p>
                            <p className="text-sm text-muted-foreground">Confirm all dues are settled. This will move the IP bill to Pending Settlement.</p>
                        </div>
                        <div className="space-y-1">
                            <Label>Billing Clerk Name</Label>
                            <Input value={billingBy} onChange={e => setBillingBy(e.target.value)} placeholder="e.g. Ravi Shankar" />
                        </div>
                        <div className="text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-md px-3 py-2.5">
                            Bill will move to "Pending Settlement" status automatically on clearance.
                        </div>
                        <Button
                            disabled={!billingBy}
                            onClick={() => {
                                setBillingClearance(admission.id, billingBy)
                                toast.success("Billing clearance granted")
                            }}
                            className="gap-2"
                        >
                            <CheckCircle className="h-4 w-4" /> Grant Billing Clearance
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Finalize */}
            {!isComplete && activeStep === 3 && (
                <Card>
                    <CardContent className="pt-5 space-y-4">
                        <div>
                            <p className="font-medium">Finalize Discharge</p>
                            <p className="text-sm text-muted-foreground">All departments cleared. Complete the discharge.</p>
                        </div>
                        <div className="grid gap-3">
                            <div className="space-y-1">
                                <Label>Discharge Type</Label>
                                <Select value={dischargeType} onValueChange={v => setDischargeType(v as DischargeType)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={DischargeType.NORMAL}>Normal</SelectItem>
                                        <SelectItem value={DischargeType.LAMA}>LAMA (Left Against Medical Advice)</SelectItem>
                                        <SelectItem value={DischargeType.REFERRED}>Referred</SelectItem>
                                        <SelectItem value={DischargeType.EXPIRED}>Expired</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>Discharge Summary</Label>
                                <Textarea
                                    value={finalSummary}
                                    onChange={e => setFinalSummary(e.target.value)}
                                    placeholder="Final clinical summary for discharge..."
                                    rows={4}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Finalized By</Label>
                                <Input value={finalBy} onChange={e => setFinalBy(e.target.value)} placeholder="Name / Designation" />
                            </div>
                        </div>
                        <Button
                            disabled={!finalSummary || !finalBy}
                            variant="destructive"
                            onClick={() => {
                                const result = finalizeDischarge(admission.id, dischargeType, finalSummary, finalBy)
                                if (result.success) {
                                    toast.success("Patient discharged successfully")
                                    onDone?.()
                                } else {
                                    toast.error(result.error ?? "Finalization failed")
                                }
                            }}
                            className="gap-2"
                        >
                            <LogOut className="h-4 w-4" /> Finalize & Discharge Patient
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Clearance status summary */}
            {!isComplete && hasStarted && (
                <div className="grid grid-cols-3 gap-3 text-sm">
                    {[
                        { label: "Clinical", done: dc.clinicalCleared, by: dc.clinicalClearedBy },
                        { label: "Pharmacy", done: dc.pharmacyCleared, by: dc.pharmacyClearedBy },
                        { label: "Billing", done: dc.billingCleared, by: dc.billingClearedBy },
                    ].map(({ label, done, by }) => (
                        <div key={label} className={cn(
                            "rounded-lg px-3 py-2 text-xs border",
                            done ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" : "bg-muted/40 border-transparent"
                        )}>
                            <div className="flex items-center gap-1.5">
                                {done ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}
                                <span className={cn("font-medium", done ? "text-green-700 dark:text-green-400" : "text-muted-foreground")}>{label}</span>
                            </div>
                            {done && by && <p className="text-muted-foreground mt-0.5 pl-5">{by}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
