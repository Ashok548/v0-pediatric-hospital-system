"use client"

import React, { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, X, Stethoscope, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { VoiceRecorder } from "@/components/VoiceRecorder"
import { appendTranscript } from "@/lib/utils/transcript"
import { createLabOrder, useLabMasterProfiles } from "@/lib/api/labs"

// Removed hardcoded AVAILABLE_PANELS

interface CreateLabOrderDialogProps {
    patientId: string
    admissionId?: string | null
    appointmentId?: string | null
    trigger?: React.ReactNode
    onSuccess?: () => void
}

export function CreateLabOrderDialog({
    patientId,
    admissionId,
    appointmentId,
    trigger,
    onSuccess,
}: CreateLabOrderDialogProps) {
    const { profiles, isLoading: isLoadingProfiles } = useLabMasterProfiles()
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedPanels, setSelectedPanels] = useState<any[]>([])
    const [notes, setNotes] = useState("")

    const { mutate } = useSWRConfig()
    const { toast } = useToast()

    const contextType = admissionId ? "INPATIENT" : appointmentId ? "OUTPATIENT" : "NONE"

    const handleSubmit = async () => {
        if (selectedPanels.length === 0) {
            toast({ title: "Validation Error", description: "Select at least one test panel.", variant: "destructive" })
            return
        }
        if (contextType === "NONE") {
            toast({ title: "Context Error", description: "Labs must be ordered under an Admission or Appointment context.", variant: "destructive" })
            return
        }

        setIsSubmitting(true)
        try {
            await createLabOrder({
                patientId,
                admissionId: admissionId || undefined,
                appointmentId: appointmentId || undefined,
                technicianNotes: notes || undefined,
                panels: selectedPanels.map(p => ({
                    panelName: p.panelName,
                    category: p.category,
                    sampleType: p.sampleType,
                    testProfileId: p.id
                })),
            })

            toast({ title: "Success", description: "Lab order created successfully." })
            setOpen(false)
            setSelectedPanels([])
            setNotes("")
            
            // Revalidate data
            mutate(`/labs/orders/patient/${patientId}`)
            if (admissionId) mutate(`/labs/orders/admission/${admissionId}`)
            mutate("/labs/orders") // Dashboard

            onSuccess?.()
        } catch (error: any) {
            toast({ title: "Failed to create order", description: error.message, variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }

    const togglePanel = (panel: any) => {
        if (selectedPanels.find(p => p.id === panel.id)) {
            setSelectedPanels(prev => prev.filter(p => p.id !== panel.id))
        } else {
            setSelectedPanels(prev => [...prev, panel])
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button size="sm"><Plus className="size-4 mr-2" /> Order Labs</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Order Laboratory Tests
                        {contextType === "INPATIENT" && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 ml-2">
                                <Building2 className="size-3 mr-1" /> Inpatient Context
                            </Badge>
                        )}
                        {contextType === "OUTPATIENT" && (
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 ml-2">
                                <Stethoscope className="size-3 mr-1" /> Outpatient Context
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Select the test panels to be performed by the laboratory for this patient.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-6 py-4">
                    {/* Panel Selection */}
                    <div className="flex flex-col gap-3">
                        <label className="text-sm font-medium">Select Test Panels</label>
                        {isLoadingProfiles ? (
                            <div className="flex items-center justify-center p-8 border rounded-lg bg-muted/20">
                                <Loader2 className="size-6 text-muted-foreground animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                                {profiles.map((panel: any) => {
                                    const isSelected = selectedPanels.some(p => p.id === panel.id)
                                    return (
                                        <div
                                            key={panel.id}
                                            onClick={() => togglePanel(panel)}
                                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                                        >
                                            <div className={`mt-0.5 size-4 rounded text-white flex items-center justify-center ${isSelected ? "bg-primary" : "border border-muted-foreground/30"}`}>
                                                {isSelected && <X className="size-3.5" style={{ transform: "rotate(45deg)" }} />}
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-medium">{panel.panelName}</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {panel.category} • {panel.sampleType}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Selected Summary */}
                    {selectedPanels.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                            {selectedPanels.map(p => (
                                <Badge key={p.id} variant="secondary" className="text-xs font-normal">
                                    {p.panelName}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Technician Notes */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Notes for Technician (Optional)</label>
                        <Textarea
                            placeholder="e.g. Fasting sample required, stat processing..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="resize-none"
                            rows={3}
                        />
                        <VoiceRecorder
                            disabled={isSubmitting}
                            onTextGenerated={(text) => setNotes((prev) => appendTranscript(prev, text))}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || selectedPanels.length === 0 || contextType === "NONE"}>
                        {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                        Submit Lab Order
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
