"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Admission, getAdmissionById, getWards, Ward, BedStatus } from "@/lib/data/admissions"
import { BedDouble, ArrowRight, Clock, FileText, CheckCircle } from "lucide-react"

interface TransferFormProps {
    admissionId: string
}

export function TransferForm({ admissionId }: TransferFormProps) {
    const router = useRouter()
    const [admission, setAdmission] = useState<Admission | null>(null)
    const [wards, setWards] = useState<Ward[]>([])

    const [selectedWardId, setSelectedWardId] = useState<string>("")
    const [selectedBedId, setSelectedBedId] = useState<string>("")
    const [transferReason, setTransferReason] = useState<string>("")
    const [transferDate, setTransferDate] = useState<string>("")

    useEffect(() => {
        async function init() {
            const data = await getAdmissionById(admissionId)
            setAdmission(data)
            const wData = await getWards()
            setWards(wData)
        }
        init()
    }, [admissionId])

    if (!admission) return <div>Loading admission details...</div>

    const selectedWard = wards.find(w => w.id === selectedWardId)

    const handleConfirm = () => {
        alert(`Transfer Confirmed for patient ${admission.patientName}. Reason: ${transferReason}`)
        router.push("/admissions") // Replace with actual path in phase 2
    }

    return (
        <Card className="max-w-4xl mx-auto shadow-md">
            <CardHeader>
                <CardTitle className="text-2xl">Bed Transfer Process</CardTitle>
                <CardDescription>Move patient to a different bed or ward.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
                {/* CURRENT LOCATION SUMMARY */}
                <div className="rounded-xl border bg-muted/30 p-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mb-3">Current Assignment</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-semibold">{admission.patientName} ({admission.patientId})</p>
                            <p className="text-xs text-muted-foreground">Admitted: {new Date(admission.admissionDateTime).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-full">
                                <BedDouble className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-semibold text-primary">{admission.currentLocation?.bedNumber || "Unassigned"}</p>
                                <p className="text-sm text-muted-foreground">{admission.currentLocation?.wardName || "No Ward"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* NEW LOCATION SELECTION */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-blue-100 text-blue-700 flex items-center justify-center rounded-full">1</div>
                        <h4 className="font-semibold text-lg">Select New Destination</h4>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6 pl-10">
                        <div className="space-y-2">
                            <Label>Target Ward</Label>
                            <Select value={selectedWardId} onValueChange={(val) => {
                                setSelectedWardId(val)
                                setSelectedBedId("")
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a ward" />
                                </SelectTrigger>
                                <SelectContent>
                                    {wards.map(w => (
                                        <SelectItem key={w.id} value={w.id}>
                                            {w.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {selectedWard && (
                        <div className="pl-10 pt-2 pb-4">
                            <Label className="mb-3 block">Available Beds in {selectedWard.name}</Label>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                                {selectedWard.beds.filter(b => b.status === BedStatus.AVAILABLE).map((bed) => {
                                    const isSelected = selectedBedId === bed.id
                                    return (
                                        <div
                                            key={bed.id}
                                            onClick={() => setSelectedBedId(bed.id)}
                                            className={`cursor-pointer rounded-lg border p-4 flex flex-col items-center justify-center transition-all ${isSelected ? 'bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary ring-offset-2' : 'bg-card hover:bg-muted'}`}
                                        >
                                            <BedDouble className="mb-2 h-5 w-5" />
                                            <span className="font-bold">{bed.number}</span>
                                        </div>
                                    )
                                })}
                                {selectedWard.beds.filter(b => b.status === BedStatus.AVAILABLE).length === 0 && (
                                    <div className="col-span-full py-4 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                                        No available beds in this ward.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* TRANSFER DETAILS */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-blue-100 text-blue-700 flex items-center justify-center rounded-full">2</div>
                        <h4 className="font-semibold text-lg">Transfer Details</h4>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6 pl-10">
                        <div className="space-y-2">
                            <Label>Date & Time of Transfer</Label>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="datetime-local"
                                    value={transferDate}
                                    onChange={(e) => setTransferDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label>Reason for Transfer</Label>
                            <div className="flex gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground mt-2.5" />
                                <Textarea
                                    placeholder="E.g., Stepping down from ICU, required isolation, etc."
                                    value={transferReason}
                                    onChange={(e) => setTransferReason(e.target.value)}
                                    className="resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

            </CardContent>
            <CardFooter className="flex justify-between border-t bg-muted/20 p-6">
                <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button
                    onClick={handleConfirm}
                    disabled={!selectedWardId || !selectedBedId || !transferReason || !transferDate}
                >
                    <ArrowRight className="mr-2 h-4 w-4" /> Execute Transfer
                </Button>
            </CardFooter>
        </Card>
    )
}
