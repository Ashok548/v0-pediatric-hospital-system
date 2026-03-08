"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Loader2 } from "lucide-react"
import { AddBillItemDto } from "@/lib/types/billing"
import { useServices } from "@/lib/api/services"
import { Badge } from "@/components/ui/badge"

export function AddChargeModal({
    onAddCharge,
    isSubmitting = false
}: {
    onAddCharge: (item: AddBillItemDto) => void,
    isSubmitting?: boolean
}) {
    const [open, setOpen] = useState(false)
    const [serviceId, setServiceId] = useState<string>("")
    const [serviceSearch, setServiceSearch] = useState("")
    const [qty, setQty] = useState(1)

    const { services, isLoading } = useServices({ limit: 100 })

    const filteredServices = useMemo(() => {
        let list = services
        if (serviceSearch) {
            const q = serviceSearch.toLowerCase()
            list = list.filter(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
        }
        return list
    }, [services, serviceSearch])

    const selectedService = services.find(s => s.id === serviceId)

    const basePrice = selectedService ? Number(selectedService.basePrice) : 0
    const taxRate = selectedService ? Number(selectedService.taxPercent) : 0
    const lineTotal = (basePrice * qty) * (1 + taxRate / 100)

    const handleAdd = () => {
        if (!selectedService || isSubmitting) return;

        onAddCharge({
            serviceId: selectedService.id,
            quantity: qty,
            discountPercent: 0
        })

        setOpen(false)
        setServiceId("")
        setServiceSearch("")
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
                        <Label>Search Service</Label>
                        <Input
                            placeholder="Type to filter services..."
                            value={serviceSearch}
                            onChange={e => setServiceSearch(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Service / Item</Label>
                        <Select value={serviceId} onValueChange={setServiceId}>
                            <SelectTrigger>
                                <SelectValue placeholder={isLoading ? "Loading..." : "Select Item"} />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoading ? (
                                    <div className="py-3 px-2 flex justify-center"><Loader2 className="animate-spin size-4 text-muted-foreground" /></div>
                                ) : filteredServices.length === 0 ? (
                                    <SelectItem value="none" disabled>No items found</SelectItem>
                                ) : (
                                    filteredServices.map(srv => (
                                        <SelectItem key={srv.id} value={srv.id}>
                                            <div className="flex justify-between items-center w-full pr-2 gap-4">
                                                <span className="truncate">{srv.name} <span className="text-muted-foreground ml-1">({srv.code})</span></span>
                                                <span className="font-medium shrink-0">₹{srv.basePrice}</span>
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        {selectedService && (
                            <p className="text-[11px] text-muted-foreground mt-1 text-right">
                                Base: ₹{basePrice} | Tax: {taxRate}%
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Quantity</Label>
                            <Input type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value) || 1))} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Total Amount (Inc. Tax)</Label>
                            <Input type="text" readOnly className="bg-muted font-semibold" value={`₹${lineTotal.toFixed(2)}`} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleAdd} disabled={!selectedService || qty < 1 || isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
                        Add to Bill
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
