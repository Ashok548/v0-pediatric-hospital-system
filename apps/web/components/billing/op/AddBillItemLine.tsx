"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Loader2 } from "lucide-react"
import { useServices } from "@/lib/api/services"
import { cn } from "@/lib/utils"
import { AddBillItemDto } from "@/lib/types/billing"

interface Props {
    onAdd: (item: AddBillItemDto) => void
}

export function AddBillItemLine({ onAdd }: Props) {
    const [serviceId, setServiceId] = useState<string>("")
    const [qty, setQty] = useState(1)
    const [discount, setDiscount] = useState(0)
    const [serviceSearch, setServiceSearch] = useState("")

    // In a real app we'd debounce serviceSearch and send to API, but fetch all for now
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

    // For preview only
    const basePrice = selectedService ? Number(selectedService.basePrice) : 0
    const taxRate = selectedService ? Number((selectedService as any).taxRate || 0) : 0
    const amountBeforeTax = (basePrice * qty) * (1 - discount / 100)
    const previewTotal = amountBeforeTax + (amountBeforeTax * taxRate / 100)

    const handleAdd = () => {
        if (!selectedService) return
        onAdd({
            serviceId: selectedService.id,
            quantity: qty,
            discountPercent: discount
        })
        setServiceId("")
        setQty(1)
        setDiscount(0)
        setServiceSearch("")
    }

    return (
        <div className="space-y-3 bg-muted/20 p-3 rounded-lg border">
            {/* Main row */}
            <div className="grid grid-cols-12 gap-2 items-end">
                {/* Service with search */}
                <div className="col-span-12 md:col-span-5 space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Service</label>
                    <Input
                        placeholder="Search services..."
                        className="bg-background mb-1.5 h-8 text-xs"
                        value={serviceSearch}
                        onChange={e => setServiceSearch(e.target.value)}
                    />
                    <Select value={serviceId} onValueChange={(v) => {
                        setServiceId(v)
                    }}>
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder={isLoading ? "Loading..." : "Select service..."} />
                        </SelectTrigger>
                        <SelectContent>
                            {isLoading ? (
                                <div className="py-3 px-2 flex justify-center"><Loader2 className="animate-spin size-4 text-muted-foreground" /></div>
                            ) : filteredServices.length === 0 ? (
                                <div className="py-3 px-2 text-center text-xs text-muted-foreground">
                                    No services match your search.
                                </div>
                            ) : (
                                filteredServices.map(srv => (
                                    <SelectItem key={srv.id} value={srv.id}>
                                        <span className="flex items-center gap-2 text-xs">
                                            <span className="font-mono text-[10px] text-muted-foreground">{srv.code}</span>
                                            {srv.name}
                                            <Badge variant="outline" className="text-[9px] px-1 py-0">{srv.serviceCategory?.name ?? 'General'}</Badge>
                                            <span className="text-muted-foreground ml-auto">₹{srv.basePrice}</span>
                                        </span>
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* Qty */}
                <div className="col-span-4 md:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Qty</label>
                    <Input type="number" min={1} className="bg-background" value={qty}
                        onChange={e => setQty(Math.max(1, Number(e.target.value) || 1))} />
                </div>

                {/* Discount */}
                <div className="col-span-4 md:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Disc %</label>
                    <Input type="number" min={0} max={100} className="bg-background" value={discount}
                        onChange={e => setDiscount(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />
                </div>

                {/* Total */}
                <div className="col-span-6 md:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total (inc. tax)</label>
                    <Input readOnly className="bg-muted font-semibold text-right"
                        value={selectedService ? `₹${previewTotal.toFixed(0)}` : "—"} />
                </div>

                {/* Add */}
                <div className="col-span-6 md:col-span-1">
                    <Button type="button" className="w-full"
                        disabled={!selectedService || qty < 1} onClick={handleAdd}>
                        <Plus className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
