"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { BillItem, ChargeCategory } from "@/lib/types/billing"
import { masterServices } from "@/lib/data/mock-billing"

export function AddChargeModal({ onAddCharge }: { onAddCharge: (item: BillItem) => void }) {
    const [open, setOpen] = useState(false)
    const [category, setCategory] = useState<ChargeCategory>(ChargeCategory.Room)
    const [serviceId, setServiceId] = useState<string>("")
    const [qty, setQty] = useState(1)

    const filteredServices = masterServices.filter(s => s.category === category)
    const selectedService = filteredServices.find(s => s.id === serviceId)

    const unitPrice = selectedService?.defaultPrice || 0;
    const lineTotal = unitPrice * qty;

    const handleAdd = () => {
        if (!selectedService) return;

        onAddCharge({
            id: `CHG-${Date.now()}`,
            serviceName: selectedService.name,
            category: selectedService.category,
            quantity: qty,
            unitPrice,
            discountPercent: 0,
            taxPercent: 0,
            lineTotal,
            dateAdded: new Date().toISOString()
        })

        setOpen(false)
        setServiceId("")
        setQty(1)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 shrink-0">
                    <Plus className="size-4" />
                    Add Charge
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Daily Charge</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Charge Category</Label>
                        <Select value={category} onValueChange={(val: ChargeCategory) => { setCategory(val); setServiceId(""); }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(ChargeCategory).map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Service / Item</Label>
                        <Select value={serviceId} onValueChange={setServiceId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Item" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredServices.length === 0 ? (
                                    <SelectItem value="none" disabled>No items found</SelectItem>
                                ) : (
                                    filteredServices.map(srv => (
                                        <SelectItem key={srv.id} value={srv.id}>
                                            {srv.name} (₹{srv.defaultPrice})
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Quantity</Label>
                            <Input type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value) || 1)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Total Amount</Label>
                            <Input type="text" readOnly className="bg-muted font-semibold" value={`₹${lineTotal.toFixed(2)}`} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleAdd} disabled={!selectedService || qty < 1}>Add to Bill</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
