import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Bed, Ward } from "@/lib/data/mock-beds"
import { transferBed } from "@/lib/store/bed-store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface TransferBedModalProps {
    bed: Bed
    wardId: string
    wards: Ward[]
    open: boolean
    onClose: () => void
}

export function TransferBedModal({ bed, wardId, wards, open, onClose }: TransferBedModalProps) {
    const [selectedWardId, setSelectedWardId] = useState("")
    const [selectedBedId, setSelectedBedId] = useState("")
    const [reason, setReason] = useState("")

    const handleTransfer = () => {
        if (!selectedWardId || !selectedBedId) return
        transferBed(wardId, bed.id, selectedWardId, selectedBedId, reason)
        onClose()
    }

    const selectedWard = wards.find(w => w.id === selectedWardId)
    const availableBeds = selectedWard?.beds.filter(b => b.status === "AVAILABLE") || []

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Transfer Patient</DialogTitle>
                    <DialogDescription>
                        Transfer {bed.patientName} from bed {bed.id} to another available bed.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Current Patient & Bed</Label>
                        <div className="text-sm font-medium p-2 bg-muted rounded-md mb-2">
                            {bed.patientName} ({bed.admissionId}) <br />
                            Currently in: {bed.id}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="ward">Target Ward</Label>
                            <Select value={selectedWardId} onValueChange={(val) => { setSelectedWardId(val); setSelectedBedId(""); }}>
                                <SelectTrigger id="ward">
                                    <SelectValue placeholder="Ward" />
                                </SelectTrigger>
                                <SelectContent>
                                    {wards.map((w) => (
                                        <SelectItem key={w.id} value={w.id}>
                                            {w.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="newbed">Target Bed</Label>
                            <Select value={selectedBedId} onValueChange={setSelectedBedId} disabled={!selectedWardId || availableBeds.length === 0}>
                                <SelectTrigger id="newbed">
                                    <SelectValue placeholder={availableBeds.length === 0 && selectedWardId ? "None Avail" : "Bed"} />
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
                            placeholder="e.g. Condition stabilized, step down to general ward..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="resize-none"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleTransfer} disabled={!selectedWardId || !selectedBedId}>Confirm Transfer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
