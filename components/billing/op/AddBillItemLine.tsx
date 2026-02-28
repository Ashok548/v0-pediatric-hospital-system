"use client"

// ─── Round 2: #10 Searchable service filter ───────────────────────────────────
// Uses category pills + text search to narrow the 36-item service dropdown

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { BillItem, ChargeCategory, computeLineTotal } from "@/lib/types/billing"
import { masterServices } from "@/lib/data/mock-billing"
import { cn } from "@/lib/utils"

interface Props {
    onAdd: (item: BillItem) => void
    filterCategory?: ChargeCategory
}

const categoryLabels: Record<string, string> = {
    ALL: 'All',
    CONSULTATION: 'Consult',
    LAB: 'Lab',
    PROCEDURE: 'Proc.',
    ROOM: 'Room',
    MEDICINE: 'Med.',
    NURSING: 'Nursing',
    MISC: 'Misc'
}

export function AddBillItemLine({ onAdd, filterCategory }: Props) {
    const [serviceId, setServiceId] = useState<string>("")
    const [qty, setQty] = useState(1)
    const [discount, setDiscount] = useState(0)
    const [tax, setTax] = useState(0)
    // #10: Category filter + search
    const [catFilter, setCatFilter] = useState<string>(filterCategory ?? 'ALL')
    const [serviceSearch, setServiceSearch] = useState("")

    const filteredServices = useMemo(() => {
        let list = filterCategory
            ? masterServices.filter(s => s.category === filterCategory)
            : masterServices

        if (catFilter !== 'ALL' && !filterCategory) {
            list = list.filter(s => s.category === catFilter)
        }

        if (serviceSearch) {
            const q = serviceSearch.toLowerCase()
            list = list.filter(s => s.name.toLowerCase().includes(q))
        }

        return list
    }, [catFilter, serviceSearch, filterCategory])

    const selectedService = masterServices.find(s => s.id === serviceId)

    const previewItem: BillItem | null = selectedService
        ? {
            id: "preview",
            serviceName: selectedService.name,
            category: selectedService.category,
            quantity: qty,
            unitPrice: selectedService.defaultPrice,
            discountPercent: discount,
            taxPercent: tax
        }
        : null
    const previewTotal = previewItem ? computeLineTotal(previewItem) : 0

    const handleAdd = () => {
        if (!selectedService) return
        onAdd({
            id: `ITEM-${Date.now()}`,
            serviceName: selectedService.name,
            category: selectedService.category,
            quantity: qty,
            unitPrice: selectedService.defaultPrice,
            discountPercent: discount,
            taxPercent: tax,
            dateAdded: new Date().toISOString()
        })
        setServiceId("")
        setQty(1)
        setDiscount(0)
        setTax(0)
        setServiceSearch("")
    }

    return (
        <div className="space-y-3 bg-muted/20 p-3 rounded-lg border">
            {/* #10: Category pills (hidden if filterCategory prop is set) */}
            {!filterCategory && (
                <div className="flex flex-wrap gap-1.5">
                    {Object.entries(categoryLabels).map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setCatFilter(key)}
                            className={cn(
                                "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors",
                                catFilter === key
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background text-muted-foreground border-border hover:border-primary/40"
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}

            {/* Main row */}
            <div className="grid grid-cols-12 gap-2 items-end">
                {/* Service with search */}
                <div className="col-span-12 md:col-span-4 space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Service</label>
                    <Input
                        placeholder="Search services..."
                        className="bg-background mb-1.5 h-8 text-xs"
                        value={serviceSearch}
                        onChange={e => setServiceSearch(e.target.value)}
                    />
                    <Select value={serviceId} onValueChange={(v) => {
                        setServiceId(v)
                        const svc = masterServices.find(s => s.id === v)
                        if (svc) setTax(svc.defaultTax)
                    }}>
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select service..." />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredServices.length === 0 ? (
                                <div className="py-3 px-2 text-center text-xs text-muted-foreground">
                                    No services match your search.
                                </div>
                            ) : (
                                filteredServices.map(srv => (
                                    <SelectItem key={srv.id} value={srv.id}>
                                        <span className="flex items-center gap-2 text-xs">
                                            {srv.name}
                                            <Badge variant="outline" className="text-[9px] px-1 py-0">{srv.category}</Badge>
                                            <span className="text-muted-foreground ml-auto">₹{srv.defaultPrice}</span>
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

                {/* Tax */}
                <div className="col-span-4 md:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tax %</label>
                    <Input type="number" min={0} max={28} className="bg-background" value={tax}
                        onChange={e => setTax(Math.min(28, Math.max(0, Number(e.target.value) || 0)))} />
                </div>

                {/* Total */}
                <div className="col-span-6 md:col-span-1 space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total</label>
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
