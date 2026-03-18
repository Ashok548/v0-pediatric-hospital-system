"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useBedHierarchy, createAdmission } from "@/lib/api/admissions"
import type { ApiFloorWithWards, ApiWardWithBeds, ApiBed, AdmissionType } from "@/lib/types/admission"
import { apiClient } from "@/lib/api-client"
import { appendTranscript } from "@/lib/utils/transcript"
import { VoiceRecorder } from "@/components/VoiceRecorder"

interface ApiPatient {
    id: string
    uhid: string
    firstName: string
    lastName: string
}
import {
    BedDouble, CheckCircle, ChevronRight,
    User, Stethoscope, Building2, Calendar, FileText, Loader2, AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

export function NewAdmissionWizard() {
    const router = useRouter()
    const [step, setStep] = useState<number>(1)
    const [submitting, setSubmitting] = useState(false)

    // ─── Patients ──────────────────────────────────────────────────────────────
    const [patients, setPatients] = useState<ApiPatient[]>([])
    const [patientsLoading, setPatientsLoading] = useState(true)

    useEffect(() => {
        apiClient<{ data: ApiPatient[] }>("/patients?limit=100&status=ACTIVE")
            .then(r => setPatients(r.data ?? []))
            .catch(() => setPatients([]))
            .finally(() => setPatientsLoading(false))
    }, [])

    // ─── Bed Hierarchy ─────────────────────────────────────────────────────────
    const { floors, isLoading: bedsLoading } = useBedHierarchy()
    const allWards = floors.flatMap((f: ApiFloorWithWards) => f.wards)
    const allDoctors = [
        { id: "", name: "No attending doctor" },
    ]

    // ─── Doctors from Users API ────────────────────────────────────────────────
    const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([])
    useEffect(() => {
        apiClient<{ data: { id: string; name: string }[] }>("/users?limit=100")
            .then(r => setDoctors(r.data ?? []))
            .catch(() => setDoctors([]))
    }, [])

    // ─── Step 1 State ──────────────────────────────────────────────────────────
    const [selectedPatientId, setSelectedPatientId] = useState("")
    const [admissionType, setAdmissionType] = useState<AdmissionType>("SCHEDULED")
    const [department, setDepartment] = useState("")
    const [doctorId, setDoctorId] = useState("")
    const [admissionDate, setAdmissionDate] = useState(() => {
        const now = new Date()
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
        return now.toISOString().slice(0, 16)
    })
    const [diagnosis, setDiagnosis] = useState("")

    // ─── Step 2 State ──────────────────────────────────────────────────────────
    const [selectedWardId, setSelectedWardId] = useState("")
    const [selectedBedId, setSelectedBedId] = useState("")

    const selectedPatient = patients.find(p => p.id === selectedPatientId || p.uhid === selectedPatientId)
    const selectedWard: ApiWardWithBeds | undefined = allWards.find((w: ApiWardWithBeds) => w.id === selectedWardId)
    const availableBeds = selectedWard?.beds.filter((b: ApiBed) => b.status === "AVAILABLE") ?? []
    const selectedBed = selectedWard?.beds.find((b: ApiBed) => b.id === selectedBedId)

    const step1Valid = selectedPatientId && admissionType && department
    const step2Valid = !!selectedBedId

    const handleConfirm = async () => {
        if (!selectedPatientId) return
        setSubmitting(true)
        try {
            const patient = patients.find(p => p.id === selectedPatientId || p.uhid === selectedPatientId)
            const result = await createAdmission({
                patientId: patient?.id ?? selectedPatientId,
                admissionType,
                department,
                admittingDoctorId: doctorId || undefined,
                admissionDate: new Date(admissionDate).toISOString(),
                initialDiagnosis: diagnosis || undefined,
                bedId: selectedBedId || undefined,
            })
            toast.success(`Admission ${result.admissionNumber} created successfully`)
            router.push("/admissions")
        } catch (err: any) {
            toast.error(err.message ?? "Failed to create admission")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="mx-auto max-w-4xl">
            {/* Step Indicator */}
            <div className="mb-8 flex items-center justify-between">
                {[
                    { n: 1, label: "Initiation" },
                    { n: 2, label: "Ward & Bed" },
                    { n: 3, label: "Confirmation" },
                ].map((s, i, arr) => (
                    <div key={s.n} className="flex flex-1 items-center">
                        <div className="flex flex-col items-center gap-1.5">
                            <div
                                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${step >= s.n
                                    ? "bg-primary text-primary-foreground shadow"
                                    : "bg-muted text-muted-foreground"
                                    } ${step === s.n ? "ring-4 ring-primary/20" : ""}`}
                            >
                                {step > s.n ? <CheckCircle className="h-5 w-5" /> : s.n}
                            </div>
                            <span className={`text-xs font-medium ${step >= s.n ? "text-primary" : "text-muted-foreground"}`}>
                                {s.label}
                            </span>
                        </div>
                        {i < arr.length - 1 && (
                            <div className={`flex-1 mx-3 h-1 rounded-full mb-5 transition-colors ${step > s.n ? "bg-primary" : "bg-muted"}`} />
                        )}
                    </div>
                ))}
            </div>

            <Card className="border-t-4 border-t-primary shadow-lg">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl">
                        {step === 1 && "Step 1 — Admission Initiation"}
                        {step === 2 && "Step 2 — Ward & Bed Assignment"}
                        {step === 3 && "Step 3 — Review & Confirm"}
                    </CardTitle>
                    <CardDescription>
                        {step === 1 && "Select the patient and fill in the admission details below."}
                        {step === 2 && "Select a ward and assign an available bed."}
                        {step === 3 && "Review the summary carefully before confirming the admission."}
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-2">
                    {/* ── STEP 1 ── */}
                    {step === 1 && (
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="space-y-2 sm:col-span-2">
                                <Label>Patient <span className="text-destructive">*</span></Label>
                                {patientsLoading ? (
                                    <Skeleton className="h-10 w-full" />
                                ) : (
                                    <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select patient by UHID or name" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {patients.map((p) => (
                                                <SelectItem key={p.id ?? p.uhid} value={p.id ?? p.uhid}>
                                                    {p.uhid} — {p.firstName} {p.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Admission Type <span className="text-destructive">*</span></Label>
                                <Select value={admissionType} onValueChange={v => setAdmissionType(v as AdmissionType)}>
                                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EMERGENCY">🚨 Emergency</SelectItem>
                                        <SelectItem value="SCHEDULED">📅 Scheduled</SelectItem>
                                        <SelectItem value="REFERRAL">🔗 Referral</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Department <span className="text-destructive">*</span></Label>
                                <Select value={department} onValueChange={setDepartment}>
                                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PICU">Pediatric ICU (PICU)</SelectItem>
                                        <SelectItem value="NICU">Neonatal ICU (NICU)</SelectItem>
                                        <SelectItem value="General">General Pediatrics</SelectItem>
                                        <SelectItem value="Surgery">Pediatric Surgery</SelectItem>
                                        <SelectItem value="Neurology">Pediatric Neurology</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Admitting Doctor</Label>
                                <Select value={doctorId} onValueChange={setDoctorId}>
                                    <SelectTrigger><SelectValue placeholder="Select doctor (optional)" /></SelectTrigger>
                                    <SelectContent>
                                        {doctors.length === 0
                                            ? <SelectItem value="loading" disabled>Loading doctors...</SelectItem>
                                            : doctors.map(d => (
                                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Admission Date & Time</Label>
                                <Input
                                    type="datetime-local"
                                    value={admissionDate}
                                    onChange={(e) => setAdmissionDate(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <Label>Initial Diagnosis Notes</Label>
                                <Textarea
                                    placeholder="Enter presenting complaints and preliminary diagnosis..."
                                    className="min-h-[110px] resize-none"
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                />
                                <VoiceRecorder
                                    disabled={submitting}
                                    onTextGenerated={(text) => setDiagnosis((prev) => appendTranscript(prev, text))}
                                />
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2 ── */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label>Ward <span className="text-destructive">*</span></Label>
                                {bedsLoading ? (
                                    <Skeleton className="h-10 w-full sm:w-[280px]" />
                                ) : (
                                    <Select
                                        value={selectedWardId}
                                        onValueChange={(val) => { setSelectedWardId(val); setSelectedBedId("") }}
                                    >
                                        <SelectTrigger className="sm:w-[280px]">
                                            <SelectValue placeholder="Choose a ward" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allWards.map((w: ApiWardWithBeds) => (
                                                <SelectItem key={w.id} value={w.id}>
                                                    {w.name} — {w.type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            {selectedWard && (
                                <div className="rounded-xl border bg-muted/20 p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <BedDouble className="h-4 w-4 text-primary" />
                                            {selectedWard.name}
                                        </h4>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex gap-1.5 items-center"><span className="inline-block w-3 h-3 rounded-full bg-green-500" />Available</span>
                                            <span className="flex gap-1.5 items-center"><span className="inline-block w-3 h-3 rounded-full bg-red-400" />Occupied</span>
                                            <span className="flex gap-1.5 items-center"><span className="inline-block w-3 h-3 rounded-full bg-amber-400" />Cleaning</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                                        {selectedWard.beds.map((bed: ApiBed) => {
                                            const isAvailable = bed.status === "AVAILABLE"
                                            const isSelected = selectedBedId === bed.id

                                            let cls = ""
                                            if (isSelected) {
                                                cls = "bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-2 shadow-md"
                                            } else if (isAvailable) {
                                                cls = "border bg-card hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all"
                                            } else {
                                                cls = bed.status === "OCCUPIED"
                                                    ? "border border-destructive/20 bg-destructive/10 text-destructive/70 cursor-not-allowed opacity-60"
                                                    : bed.status === "CLEANING"
                                                        ? "border border-amber-200 bg-amber-50 dark:bg-amber-900/20 text-amber-700 cursor-not-allowed opacity-60"
                                                        : "border border-gray-200 bg-gray-50 dark:bg-gray-900/20 text-gray-500 cursor-not-allowed opacity-60"
                                            }

                                            return (
                                                <div
                                                    key={bed.id}
                                                    onClick={() => isAvailable && setSelectedBedId(bed.id)}
                                                    className={`flex flex-col items-center justify-center rounded-xl p-4 text-center ${cls}`}
                                                >
                                                    <BedDouble className="mb-1.5 h-5 w-5" />
                                                    <span className="font-bold text-sm">{bed.bedNumber}</span>
                                                    <span className="text-[10px] uppercase tracking-wide mt-0.5 opacity-70">{bed.status}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    {selectedBedId && (
                                        <p className="text-sm text-green-600 font-medium flex items-center gap-1.5">
                                            <CheckCircle className="h-4 w-4" /> Bed {selectedBed?.bedNumber} selected
                                        </p>
                                    )}
                                    {availableBeds.length === 0 && (
                                        <p className="text-sm text-amber-600 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" /> No available beds in this ward
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── STEP 3: SUMMARY ── */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <div className="rounded-xl border overflow-hidden">
                                {/* Patient block */}
                                <div className="bg-primary/5 px-5 py-4 border-b">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Patient</p>
                                    <div className="flex flex-wrap gap-x-8 gap-y-2">
                                        <div className="flex gap-2 items-center">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-semibold">{selectedPatient?.firstName} {selectedPatient?.lastName}</span>
                                        </div>
                                        <div className="flex gap-2 items-center text-muted-foreground text-sm">
                                            <FileText className="h-4 w-4" />
                                            {selectedPatient?.uhid}
                                        </div>
                                    </div>
                                </div>

                                {/* Admission details */}
                                <div className="px-5 py-4 border-b grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Admission Type</p>
                                        <Badge variant={admissionType === "EMERGENCY" ? "destructive" : "secondary"}>{admissionType}</Badge>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Department</p>
                                        <p className="font-medium text-sm">{department}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Admitting Doctor</p>
                                        <p className="font-medium text-sm flex items-center gap-1.5">
                                            <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                                            {doctors.find(d => d.id === doctorId)?.name ?? "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Date & Time</p>
                                        <p className="font-medium text-sm flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                            {admissionDate ? new Date(admissionDate).toLocaleString("en-IN") : "—"}
                                        </p>
                                    </div>
                                    {diagnosis && (
                                        <div className="sm:col-span-2">
                                            <p className="text-xs text-muted-foreground mb-1">Initial Diagnosis</p>
                                            <p className="text-sm italic text-muted-foreground bg-muted/40 p-2 rounded">{diagnosis}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Bed allocation */}
                                {selectedBed && selectedWard ? (
                                    <div className="px-5 py-4">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Bed Allocation</p>
                                        <div className="flex items-center gap-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
                                            <div className="bg-green-100 dark:bg-green-800 p-3 rounded-full">
                                                <BedDouble className="h-6 w-6 text-green-700 dark:text-green-300" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg text-green-700 dark:text-green-300">{selectedBed.bedNumber}</p>
                                                <p className="text-sm text-green-600 dark:text-green-400">{selectedWard.name}</p>
                                            </div>
                                            <span className="ml-auto text-xs font-semibold bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-3 py-1 rounded-full">Ready</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="px-5 py-4">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Bed Allocation</p>
                                        <p className="text-sm text-muted-foreground italic">No bed assigned — bed will be assigned later</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t bg-muted/20 p-4">
                    <Button variant="outline" onClick={() => setStep(s => Math.max(s - 1, 1))} disabled={step === 1}>
                        Back
                    </Button>
                    {step < 3 ? (
                        <Button onClick={() => setStep(s => Math.min(s + 1, 3))} disabled={step === 1 ? !step1Valid : !step2Valid}>
                            Continue <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button className="bg-green-600 hover:bg-green-700" onClick={handleConfirm} disabled={submitting}>
                            {submitting
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                                : <><CheckCircle className="mr-2 h-4 w-4" /> Confirm Admission</>
                            }
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
