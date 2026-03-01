"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Admission, getAdmissionById, DischargeStatus, DischargeType } from "@/lib/data/admissions"
import { FileText, Lock, FileSignature, Send, AlertTriangle, ArrowLeft } from "lucide-react"

interface DischargeWorkflowProps {
    admissionId: string
}

export function DischargeWorkflow({ admissionId }: DischargeWorkflowProps) {
    const router = useRouter()
    const [admission, setAdmission] = useState<Admission | null>(null)

    // Discharge State
    const [status, setStatus] = useState<DischargeStatus>(DischargeStatus.DRAFT)
    const [dischargeType, setDischargeType] = useState<string>("")
    const [dischargeDate, setDischargeDate] = useState<string>("")
    const [dischargeSummary, setDischargeSummary] = useState<string>("")

    useEffect(() => {
        async function init() {
            const data = await getAdmissionById(admissionId)
            setAdmission(data)
        }
        init()
    }, [admissionId])

    if (!admission) return <div>Loading discharge details...</div>

    const isLocked = status === DischargeStatus.LOCKED
    const steps = [
        { id: DischargeStatus.DRAFT, label: "Drafting", icon: FileText },
        { id: DischargeStatus.UNDER_REVIEW, label: "Under Review", icon: Send },
        { id: DischargeStatus.FINALIZED, label: "Finalized", icon: FileSignature },
        { id: DischargeStatus.LOCKED, label: "Locked", icon: Lock }
    ]

    const currentStepIndex = steps.findIndex(s => s.id === status)

    const advanceStatus = () => {
        if (status === DischargeStatus.DRAFT) setStatus(DischargeStatus.UNDER_REVIEW)
        else if (status === DischargeStatus.UNDER_REVIEW) setStatus(DischargeStatus.FINALIZED)
        else if (status === DischargeStatus.FINALIZED) setStatus(DischargeStatus.LOCKED)
    }

    return (
        <Card className="max-w-4xl mx-auto shadow-md">
            <CardHeader className={`${isLocked ? 'bg-amber-50/50' : ''}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            Discharge Workflow
                            {isLocked && <Lock className="h-5 w-5 text-amber-600" />}
                        </CardTitle>
                        <CardDescription>
                            Patient: {admission.patientName} | Status: {admission.status}
                        </CardDescription>
                    </div>
                    {isLocked && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                            <AlertTriangle className="h-4 w-4" /> Record Locked
                        </span>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-8 pt-6">

                {/* STATUS PROGRESSION */}
                <div className="relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 z-0"></div>
                    <div
                        className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
                        style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                    ></div>
                    <div className="relative z-10 flex justify-between">
                        {steps.map((step, idx) => {
                            const isActive = idx <= currentStepIndex
                            const isCurrent = idx === currentStepIndex
                            const Icon = step.icon

                            return (
                                <div key={step.id} className="flex flex-col items-center">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${isActive
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-muted-foreground/30 bg-card text-muted-foreground'
                                        } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className={`mt-2 text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {step.label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* DISCHARGE FORM */}
                <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Discharge Type</Label>
                            <Select disabled={isLocked} value={dischargeType} onValueChange={setDischargeType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select outcome" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={DischargeType.NORMAL}>Routine / Normal</SelectItem>
                                    <SelectItem value={DischargeType.LAMA}>LAMA (Leave Against Medical Advice)</SelectItem>
                                    <SelectItem value={DischargeType.REFERRED}>Referred to Another Facility</SelectItem>
                                    <SelectItem value={DischargeType.EXPIRED}>Expired (Mortality)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Discharge Date & Time</Label>
                            <Input
                                type="datetime-local"
                                disabled={isLocked}
                                value={dischargeDate}
                                onChange={(e) => setDischargeDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label>Discharge Summary</Label>
                            <Textarea
                                disabled={isLocked}
                                placeholder="Include diagnosis, medications, follow-up instructions, and clinical summary..."
                                className="min-h-[250px] resize-y"
                                value={dischargeSummary}
                                onChange={(e) => setDischargeSummary(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

            </CardContent>
            <CardFooter className={`flex justify-between border-t p-6 ${isLocked ? 'bg-amber-50/30' : 'bg-muted/20'}`}>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Return to Admission
                </Button>

                {!isLocked && (
                    <Button
                        onClick={advanceStatus}
                        disabled={!dischargeType || !dischargeDate || !dischargeSummary}
                        className={status === DischargeStatus.FINALIZED ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
                    >
                        {status === DischargeStatus.DRAFT && "Submit for Review"}
                        {status === DischargeStatus.UNDER_REVIEW && "Finalize Discharge"}
                        {status === DischargeStatus.FINALIZED && (
                            <>
                                <Lock className="mr-2 h-4 w-4" /> Lock Record
                            </>
                        )}
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
