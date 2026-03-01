import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Bed, Floor } from "@/lib/data/mock-floors"
import { assignBed } from "@/lib/store/bed-store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface AssignBedModalProps {
    bed: Bed
    floorId: string
    wardId: string
    floors: Floor[]
    open: boolean
    onClose: () => void
}

// Mock patients needing admission
const mockPendingPatients = [
    { id: "PED-20260220", name: "Ananya Patel", reason: "Viral Fever" },
    { id: "PED-20260221", name: "Rishi Kumar", reason: "Asthma Exacerbation" },
    { id: "PED-20260225", name: "Vikram Singh", reason: "Observation" }
]

export function AssignBedModal({ bed, floorId, wardId, floors, open, onClose }: AssignBedModalProps) {
    const [selectedPatientId, setSelectedPatientId] = useState("")

    const handleAssign = () => {
        if (!selectedPatientId) return
        const pt = mockPendingPatients.find(p => p.id === selectedPatientId)
        if (!pt) return
        assignBed(floorId, wardId, bed.id, pt.name, `ADM-${Date.now().toString().slice(-6)}`)
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assign Patient to Bed</DialogTitle>
                    <DialogDescription>
                        Select a pending admission to assign to this bed.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Target Location</Label>
                        <div className="text-sm border rounded-md p-3 bg-muted/30">
                            <span className="font-semibold text-primary">{floors.find(f => f.id === floorId)?.name}</span> <br />
                            <span className="text-muted-foreground mt-1 inline-block text-xs">
                                {floors.find(f => f.id === floorId)?.wards.find(w => w.id === wardId)?.name} → Bed {bed.id}
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="patient">Select Patient</Label>
                        <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                            <SelectTrigger id="patient">
                                <SelectValue placeholder="Select patient..." />
                            </SelectTrigger>
                            <SelectContent>
                                {mockPendingPatients.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name} ({p.id}) - {p.reason}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleAssign} disabled={!selectedPatientId}>Confirm Assignment</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
