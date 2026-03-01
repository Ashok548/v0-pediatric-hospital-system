import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Bed, Floor } from "@/lib/data/mock-floors"
import { transferBed } from "@/lib/store/bed-store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface TransferBedModalProps {
    bed: Bed
    floorId: string
    wardId: string
    floors: Floor[]
    open: boolean
    onClose: () => void
}

export function TransferBedModal({ bed, floorId, wardId, floors, open, onClose }: TransferBedModalProps) {
    const [selectedFloorId, setSelectedFloorId] = useState<string>(floorId)
    const [selectedWardId, setSelectedWardId] = useState<string>("")
    const [selectedBedId, setSelectedBedId] = useState<string>("")
    const [reason, setReason] = useState("")

    // Fix #3: Reset cascade state whenever the modal is re-opened
    useEffect(() => {
        if (open) {
            setSelectedFloorId(floorId)
            setSelectedWardId("")
            setSelectedBedId("")
            setReason("")
        }
    }, [open, floorId])

    const handleTransfer = () => {
        if (!selectedFloorId || !selectedWardId || !selectedBedId) return
        transferBed(floorId, wardId, bed.id, selectedFloorId, selectedWardId, selectedBedId, reason)
        onClose()
    }

    const selectedFloor = floors.find(f => f.id === selectedFloorId)
    const selectedWard = selectedFloor?.wards.find(w => w.id === selectedWardId)
    const availableBeds = selectedWard?.beds.filter(b => b.status === "Available") || []

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Transfer Patient</DialogTitle>
                    <DialogDescription>
                        Move {bed.patientName} to a different bed, ward, or floor.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Current Assignment</Label>
                        <div className="text-sm border rounded-md p-3 bg-muted/30">
                            <span className="font-semibold">{bed.patientName}</span> ({bed.admissionId}) <br />
                            {/* Fix #8: Truncate long floor name on mobile */}
                            <span className="text-muted-foreground mt-1 inline-block text-xs truncate max-w-full">
                                From: {floors.find(f => f.id === floorId)?.name.split(' - ')[0]} → {floors.find(f => f.id === floorId)?.wards.find(w => w.id === wardId)?.name} → Bed {bed.id}
                            </span>
                        </div>
                    </div>

                    {/* Cascading Target Selectors */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="grid gap-2">
                            <Label htmlFor="floor">Target Floor</Label>
                            <Select
                                value={selectedFloorId}
                                onValueChange={(val) => {
                                    setSelectedFloorId(val)
                                    setSelectedWardId("")
                                    setSelectedBedId("")
                                }}
                            >
                                <SelectTrigger id="floor">
                                    <SelectValue placeholder="Floor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {floors.map((f) => (
                                        <SelectItem key={f.id} value={f.id}>
                                            {f.name.split(' - ')[0]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="ward">Target Ward</Label>
                            <Select
                                value={selectedWardId}
                                onValueChange={(val) => {
                                    setSelectedWardId(val)
                                    setSelectedBedId("")
                                }}
                                disabled={!selectedFloorId}
                            >
                                <SelectTrigger id="ward">
                                    <SelectValue placeholder="Ward" />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectedFloor?.wards.map((w) => (
                                        <SelectItem key={w.id} value={w.id}>
                                            {w.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="bed">Target Bed</Label>
                            <Select
                                value={selectedBedId}
                                onValueChange={setSelectedBedId}
                                disabled={!selectedWardId || availableBeds.length === 0}
                            >
                                <SelectTrigger id="bed">
                                    <SelectValue placeholder={
                                        !selectedWardId ? "Select ward" :
                                            availableBeds.length === 0 ? "Full" : "Bed"
                                    } />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableBeds.map((b) => (
                                        <SelectItem key={b.id} value={b.id}>
                                            {b.id}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="reason">Reason for Transfer</Label>
                        <Textarea
                            id="reason"
                            placeholder="e.g. Condition stabilized, step down from ICU to general ward..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="resize-none"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleTransfer} disabled={!selectedFloorId || !selectedWardId || !selectedBedId}>Confirm Transfer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
