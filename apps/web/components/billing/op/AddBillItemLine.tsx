"use client"

import { useState, useMemo, useRef, useEffect } from "react"
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
    department?: string | null
}

export function AddBillItemLine({ onAdd, department }: Props) {
    const [serviceId, setServiceId] = useState<string>("")
    const [qty, setQty] = useState(1)
    const [discount, setDiscount] = useState(0)
    const [serviceSearch, setServiceSearch] = useState("")
    const searchInputRef = useRef<HTMLInputElement>(null)

    // Auto-focus on mount
    useEffect(() => {
        searchInputRef.current?.focus()
    }, [])

    // Fetch main dropdown list (filtered by OP care type)
    const { services, isLoading } = useServices({ limit: 150, careType: "OP" })

    // Fetch context-aware quick charge buttons for this specific department
    const { services: quickChargeServices } = useServices({ 
        limit: 5, 
        careType: "OP", 
        departmentName: department || undefined 
    })

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
        searchInputRef.current?.focus()
    }

    const handleQuickAdd = (id: string) => {
        onAdd({
            serviceId: id,
            quantity: 1,
            discountPercent: 0
        })
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            if (serviceId && selectedService) {
                handleAdd()
            } else if (serviceSearch && filteredServices.length > 0) {
                // Auto-select and add top result
                onAdd({
                    serviceId: filteredServices[0].id,
                    quantity: qty,
                    discountPercent: discount
                })
                setServiceId("")
                setQty(1)
                setDiscount(0)
                setServiceSearch("")
                setTimeout(() => searchInputRef.current?.focus(), 50)
            }
        }
    }

    return (
        <div className="space-y-4">
            {/* Quick Charge Buttons */}
            {quickChargeServices.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {quickChargeServices.map(qs => (
                        <Button 
                            key={qs.id} 
                            variant="secondary" 
                            size="sm" 
                            className="h-7 text-[11px] px-3 font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            onClick={() => handleQuickAdd(qs.id)}
                            type="button"
                        >
                            + {qs.name} <span className="text-primary/70 ml-1 opacity-70">₹{String(qs.basePrice)}</span>
                        </Button>
                    ))}
                </div>
            )}

            <div className="space-y-3 bg-muted/20 p-3 rounded-lg border">
                {/* Main row */}
                <div className="grid grid-cols-12 gap-2 items-end">
                    {/* Service with search */}
                    <div className="col-span-12 md:col-span-5 space-y-1.5">
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Service</label>
                        <Input
                            ref={searchInputRef}
                            placeholder="Type to search and press Enter..."
                            className="bg-background mb-1.5 h-8 text-xs"
                            value={serviceSearch}
                            onChange={e => setServiceSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
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
                                                <Badge variant="outline" className="text-[9px] px-1 py-0 border-muted-foreground/30 text-muted-foreground">
                                                    {srv.uiGroup || srv.category || 'General'}
                                                </Badge>
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
                    <Input type="number" min={1} className="bg-background h-8" value={qty}
                        onKeyDown={handleKeyDown}
                        onChange={e => setQty(Math.max(1, Number(e.target.value) || 1))} />
                </div>

                {/* Discount */}
                <div className="col-span-4 md:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Disc %</label>
                    <Input type="number" min={0} max={100} className="bg-background h-8" value={discount}
                        onKeyDown={handleKeyDown}
                        onChange={e => setDiscount(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />
                </div>

                {/* Total */}
                <div className="col-span-6 md:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total (inc. tax)</label>
                    <Input readOnly className="bg-muted font-semibold text-right h-8"
                        value={selectedService ? `₹${previewTotal.toFixed(0)}` : "—"} />
                </div>

                {/* Add */}
                <div className="col-span-6 md:col-span-1">
                    <Button type="button" className="w-full h-8"
                        disabled={(!selectedService && !(serviceSearch && filteredServices.length > 0)) || qty < 1} 
                        onClick={() => {
                            if (!selectedService && serviceSearch && filteredServices.length > 0) {
                                // Fallback add top result if not explicitly selected but text typed
                                onAdd({
                                    serviceId: filteredServices[0].id,
                                    quantity: qty,
                                    discountPercent: discount
                                })
                                setServiceId("")
                                setQty(1)
                                setDiscount(0)
                                setServiceSearch("")
                                setTimeout(() => searchInputRef.current?.focus(), 50)
                            } else {
                                handleAdd()
                            }
                        }}>
                        <Plus className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
        </div>
    )
}

