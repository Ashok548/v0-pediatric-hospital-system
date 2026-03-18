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
import { Loader2, Plus, Building2, Stethoscope } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { VoiceRecorder } from "@/components/VoiceRecorder"
import { appendTranscript } from "@/lib/utils/transcript"
import { createServiceOrder } from "@/lib/api/service-orders"
import { useServices } from "@/lib/api/services"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface CreateServiceOrderDialogProps {
    patientId: string
    admissionId?: string | null
    trigger?: React.ReactNode
    onSuccess?: () => void
}

export function CreateServiceOrderDialog({
    patientId,
    admissionId,
    trigger,
    onSuccess,
}: CreateServiceOrderDialogProps) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedServiceId, setSelectedServiceId] = useState<string>("")
    const [priority, setPriority] = useState<string>("NORMAL")
    const [quantity, setQuantity] = useState<number>(1)
    const [notes, setNotes] = useState("")

    const { services, isLoading: isLoadingServices } = useServices({ limit: 200 })
    const activeServices = services.filter((s: any) => s.status === "ACTIVE")

    const { mutate } = useSWRConfig()
    const { toast } = useToast()

    const contextType = admissionId ? "INPATIENT" : "OUTPATIENT"

    const handleSubmit = async () => {
        if (!selectedServiceId) {
            toast({ title: "Validation Error", description: "Please select a service.", variant: "destructive" })
            return
        }

        setIsSubmitting(true)
        try {
            await createServiceOrder({
                patientId,
                admissionId: admissionId || undefined,
                serviceId: selectedServiceId,
                priority,
                quantity,
                notes: notes || undefined,
            })

            toast({ title: "Success", description: "Service order created successfully." })
            setOpen(false)
            setSelectedServiceId("")
            setPriority("NORMAL")
            setQuantity(1)
            setNotes("")
            
            // Revalidate data
            if (admissionId) mutate(`/service-orders/admission/${admissionId}`)

            onSuccess?.()
        } catch (error: any) {
            toast({ title: "Failed to create order", description: error.message, variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button size="sm"><Plus className="size-4 mr-2" /> Order Service</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Order Clinical Service
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
                        Request a clinical service or procedure for this patient.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {/* Service Selection */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Select Service <span className="text-destructive">*</span></label>
                        <Select value={selectedServiceId} onValueChange={setSelectedServiceId} disabled={isLoadingServices}>
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingServices ? "Loading services..." : "Select a service"} />
                            </SelectTrigger>
                            <SelectContent>
                                {activeServices.map((service: any) => (
                                    <SelectItem key={service.id} value={service.id}>
                                        {service.name} ({service.category})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Priority</label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NORMAL">Normal</SelectItem>
                                    <SelectItem value="URGENT">Urgent</SelectItem>
                                    <SelectItem value="STAT">STAT</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Quantity</label>
                            <Input 
                                type="number" 
                                min={1} 
                                value={quantity} 
                                onChange={(e) => setQuantity(Number(e.target.value) || 1)} 
                            />
                        </div>
                    </div>

                    {/* Clinical Notes */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Clinical Notes (Optional)</label>
                        <Textarea
                            placeholder="Add specific instructions for this service..."
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
                    <Button onClick={handleSubmit} disabled={isSubmitting || !selectedServiceId}>
                        {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                        Submit Service Order
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
