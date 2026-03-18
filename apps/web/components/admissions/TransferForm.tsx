"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { VoiceRecorder } from "@/components/VoiceRecorder"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAdmission, useBedHierarchy, transferBed } from "@/lib/api/admissions"
import { appendTranscript } from "@/lib/utils/transcript"
import type { ApiWardWithBeds, ApiBed, WardTypeType } from "@/lib/types/admission"
import { BedDouble, ArrowRight, AlertCircle, Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface Props { admissionId: string }

/** Human-readable label for a WardType enum value */
function wardTypeLabel(type: WardTypeType): string {
    const labels: Record<WardTypeType, string> = {
        NICU: "NICU",
        PICU: "PICU",
        GENERAL: "General Ward",
        PRIVATE: "Private Ward",
        SURGICAL: "Surgical Ward",
    }
    return labels[type] ?? type
}

/** Order in which ward groups appear in the dropdown */
const WARD_GROUP_ORDER: WardTypeType[] = ["NICU", "PICU", "SURGICAL", "GENERAL", "PRIVATE"]

export function TransferForm({ admissionId }: Props) {
    const router = useRouter()
    const { admission, isLoading: admLoading, error: admError } = useAdmission(admissionId)
    const { floors, isLoading: bedsLoading } = useBedHierarchy()
    const allWards = floors.flatMap(f => f.wards)

    const [selectedWardId, setSelectedWardId] = useState("")
    const [selectedBedId, setSelectedBedId] = useState("")
    const [transferReason, setTransferReason] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const selectedWard: ApiWardWithBeds | undefined = allWards.find((w: ApiWardWithBeds) => w.id === selectedWardId)
    const availableBeds = selectedWard?.beds.filter((b: ApiBed) => b.status === "AVAILABLE" && b.id !== admission?.currentBedId) ?? []

    // Detect cross-department transfer (current ward type vs selected ward type)
    const currentWardType: WardTypeType | undefined = admission?.currentBed?.ward?.type as WardTypeType | undefined
    const isCrossDepartment = !!(currentWardType && selectedWard && currentWardType !== selectedWard.type)
    const reasonRequired = isCrossDepartment && !transferReason.trim()

    // Group wards by type for the dropdown
    const wardsByType = WARD_GROUP_ORDER.reduce<Record<string, ApiWardWithBeds[]>>((acc, type) => {
        const group = allWards.filter((w: ApiWardWithBeds) => w.type === type)
        if (group.length > 0) acc[type] = group
        return acc
    }, {})

    const handleConfirm = async () => {
        if (!selectedBedId) return
        if (reasonRequired) {
            toast.error("Please provide a reason for the department transfer")
            return
        }
        setSubmitting(true)
        try {
            const result = await transferBed(admissionId, { toBedId: selectedBedId, reason: transferReason || undefined })
            toast.success(`Patient transferred to bed ${result.currentBed?.bedNumber ?? selectedBedId}`)
            router.push("/admissions")
        } catch (err: any) {
            toast.error(err.message ?? "Transfer failed")
        } finally {
            setSubmitting(false)
        }
    }

    if (admLoading || bedsLoading) {
        return (
            <Card className="max-w-4xl mx-auto">
                <CardContent className="pt-6 space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-32 w-full" />
                </CardContent>
            </Card>
        )
    }

    if (admError || !admission) {
        return (
            <Card className="max-w-4xl mx-auto">
                <CardContent className="pt-6 flex flex-col items-center gap-3 py-16 text-destructive">
                    <AlertCircle className="h-10 w-10" />
                    <p className="font-medium">Admission not found</p>
                    <Button variant="outline" onClick={() => router.push("/admissions")}>Back to Admissions</Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="max-w-4xl mx-auto shadow-md">
            <CardHeader>
                <CardTitle className="text-2xl">Bed Transfer Process</CardTitle>
                <CardDescription>Move patient to a different bed or ward.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
                {/* Current Location */}
                <div className="rounded-xl border bg-muted/30 p-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mb-3">Current Assignment</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-semibold">{admission.patient.firstName} {admission.patient.lastName}</p>
                            <p className="text-xs text-muted-foreground">{admission.admissionNumber}</p>
                            <p className="text-xs text-muted-foreground">Admitted: {new Date(admission.admissionDate).toLocaleString("en-IN")}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-full">
                                <BedDouble className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-semibold text-primary">{admission.currentBed?.bedNumber ?? "Unassigned"}</p>
                                <p className="text-sm text-muted-foreground">{admission.currentBed?.ward.name ?? "No Ward"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* New Location */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center rounded-full font-semibold">1</div>
                        <h4 className="font-semibold text-lg">Select New Destination</h4>
                    </div>

                    <div className="pl-10 space-y-2">
                        <Label>Target Ward</Label>
                        <Select value={selectedWardId} onValueChange={(val) => { setSelectedWardId(val); setSelectedBedId("") }}>
                            <SelectTrigger className="sm:w-[320px]">
                                <SelectValue placeholder="Choose a ward" />
                            </SelectTrigger>
                            <SelectContent>
                                {WARD_GROUP_ORDER.filter(t => wardsByType[t]).map((type) => (
                                    <div key={type}>
                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            {wardTypeLabel(type as WardTypeType)}
                                        </div>
                                        {wardsByType[type].map((w: ApiWardWithBeds) => (
                                            <SelectItem key={w.id} value={w.id}>
                                                {w.name}
                                                {currentWardType && currentWardType !== w.type && (
                                                    <span className="ml-2 text-amber-600 text-xs font-medium">(step-down)</span>
                                                )}
                                            </SelectItem>
                                        ))}
                                    </div>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {isCrossDepartment && (
                        <div className="pl-10">
                            <Alert variant="destructive" className="border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-600">
                                <AlertTriangle className="h-4 w-4 !text-amber-600" />
                                <AlertDescription>
                                    <strong>Department Transfer:</strong> This will move the patient from{" "}
                                    <strong>{wardTypeLabel(currentWardType!)}</strong> to{" "}
                                    <strong>{wardTypeLabel(selectedWard!.type as WardTypeType)}</strong>.
                                    The admission record will be updated to reflect the new department.
                                    A reason is required.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {selectedWard && (
                        <div className="pl-10 pt-2">
                            <Label className="mb-3 block">Available Beds in {selectedWard.name}</Label>
                            {availableBeds.length === 0 ? (
                                <div className="py-4 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                                    No available beds in this ward.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                                    {availableBeds.map((bed: ApiBed) => {
                                        const isSelected = selectedBedId === bed.id
                                        return (
                                            <div
                                                key={bed.id}
                                                onClick={() => setSelectedBedId(bed.id)}
                                                className={`cursor-pointer rounded-lg border p-4 flex flex-col items-center justify-center transition-all ${isSelected
                                                    ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary ring-offset-2"
                                                    : "bg-card hover:bg-muted"
                                                    }`}
                                            >
                                                <BedDouble className="mb-2 h-5 w-5" />
                                                <span className="font-bold text-sm">{bed.bedNumber}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                            {selectedBedId && (
                                <p className="text-sm text-green-600 font-medium mt-3 flex items-center gap-1.5">
                                    <CheckCircle className="h-4 w-4" /> Bed {availableBeds.find(b => b.id === selectedBedId)?.bedNumber} selected
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Transfer Reason */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center rounded-full font-semibold">2</div>
                        <h4 className="font-semibold text-lg">Reason for Transfer</h4>
                    </div>
                    <div className="pl-10">
                        <Textarea
                            placeholder="E.g., Stepping down from ICU, required isolation..."
                            value={transferReason}
                            onChange={e => setTransferReason(e.target.value)}
                            className="resize-none"
                            rows={3}
                        />
                        <VoiceRecorder
                            disabled={submitting}
                            onTextGenerated={(text) => setTransferReason((prev) => appendTranscript(prev, text))}
                        />
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t bg-muted/20 p-6">
                <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button
                    onClick={handleConfirm}
                    disabled={!selectedBedId || submitting || reasonRequired}
                    variant={isCrossDepartment ? "destructive" : "default"}
                >
                    {submitting
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transferring...</>
                        : isCrossDepartment
                            ? <><ArrowRight className="mr-2 h-4 w-4" /> Confirm Step-Down Transfer</>
                            : <><ArrowRight className="mr-2 h-4 w-4" /> Execute Transfer</>
                    }
                </Button>
            </CardFooter>
        </Card>
    )
}
