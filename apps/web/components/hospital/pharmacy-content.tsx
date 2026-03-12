"use client"

import { useState } from "react"
import { usePrescriptions, usePharmacyStats, useLowStockInventory, dispensePrescription, returnPrescription, adjustStock, ApiPrescription, ApiMedication } from "@/lib/api/pharmacy"
import { useAuthStore } from "@/lib/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Pill, CheckCircle, Clock, User, BedDouble, AlertCircle, AlertTriangle, Search, Undo2, Loader2, Plus, PackagePlus } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { PharmacyInventoryTab } from "./pharmacy-inventory-tab"

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
    PARTIAL: { label: "Partial", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
    DISPENSED: { label: "Dispensed", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
    RETURNED: { label: "Returned", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300" },
    CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
}

function OrderCard({ order, onAction, actionLabel, icon }: { order: ApiPrescription; onAction: (order: ApiPrescription) => void; actionLabel?: string; icon?: React.ReactNode }) {
    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
    const timeAgo = formatDistanceToNow(new Date(order.orderedAt), { addSuffix: true })
    const isUrgent = order.admission?.currentBed?.ward?.type === "NICU" || order.admission?.currentBed?.ward?.type === "PICU"

    return (
        <Card className={`hover:shadow-md transition-shadow relative overflow-hidden ${isUrgent && (order.status === 'PENDING' || order.status === 'PARTIAL') ? 'border-red-300 dark:border-red-800' : ''}`}>
            {isUrgent && (order.status === 'PENDING' || order.status === 'PARTIAL') && (
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
            )}
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="font-semibold text-base">{order.patient.firstName} {order.patient.lastName}</p>
                        <p className="text-xs text-muted-foreground">{order.patient.uhid}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.color}`}>
                        {cfg.label}
                    </span>
                </div>
                <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 shrink-0" />{order.doctor.name}
                    </div>
                    {order.admission?.currentBed && (
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                            <BedDouble className="h-3.5 w-3.5 shrink-0" />{order.admission.currentBed.ward.name} / {order.admission.currentBed.bedNumber}
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0" />Ordered {timeAgo}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {order.notes && (
                    <div className="flex items-start gap-1.5 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-md px-2 py-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{order.notes}</span>
                    </div>
                )}
                <div className="space-y-1.5">
                    {order.items.map(item => (
                        <div key={item.id} className="flex flex-col bg-muted/40 rounded-md px-2.5 py-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium truncate pr-2">{item.medication.drugName} <span className="text-muted-foreground font-normal text-xs">{item.medication.strength}</span></span>
                                <span className="text-muted-foreground shrink-0 text-xs font-medium">
                                    {(order.status === "DISPENSED" || order.status === "RETURNED") ? `${item.dispensedQty}` : `${item.prescribedQty}`} {item.medication.unit}
                                </span>
                            </div>
                            {(item.dose || item.frequency) && (
                                <div className="text-[10px] text-muted-foreground mt-1 flex gap-2">
                                    {item.dose && <span>Dose: {item.dose}</span>}
                                    {item.frequency && <span>Freq: {item.frequency}</span>}
                                    {item.duration && <span>Duration: {item.duration}d</span>}
                                </div>
                            )}
                            {item.instructions && (
                                <div className="text-[10px] italic text-blue-600 dark:text-blue-400 mt-0.5 leading-tight">
                                    "{item.instructions}"
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {actionLabel && (
                    <Button variant={order.status === "DISPENSED" ? "secondary" : "default"} className="w-full gap-2 mt-2" size="sm" onClick={() => onAction(order)}>
                        {icon} {actionLabel}
                    </Button>
                )}
                {(order.status === "DISPENSED" || order.status === "PARTIAL") && !actionLabel && (
                    <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 rounded-md px-2 py-1.5 mt-2">
                        <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                        Dispensed by {order.dispensedBy} · {order.dispensedAt && format(new Date(order.dispensedAt), "dd MMM, HH:mm")}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function InventoryAlertCard({ med, onRestock }: { med: ApiMedication, onRestock: (med: ApiMedication) => void }) {
    const isCritical = med.severity === 'CRITICAL';
    const isWarning = med.severity === 'WARNING';

    // Calculate progress percentage mapping stockAvailable to reorderLevel
    // If stock is 0, percentage is 0. If stock == reorderLevel, it's 100% of the allowed "low zone".
    const percentage = med.reorderLevel > 0
        ? Math.min(100, Math.max(0, (med.stockAvailable / med.reorderLevel) * 100))
        : 0;

    return (
        <Card className={`overflow-hidden relative ${isCritical ? 'border-red-300 dark:border-red-800 bg-red-50/30' : ''}`}>
            {isCritical && <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />}
            {isWarning && <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />}
            <CardHeader className="pb-3 flex flex-row items-start gap-4">
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <CardTitle className="text-base font-bold">{med.drugName}</CardTitle>
                        <div className="flex gap-2 items-center">
                            {med.expiringSoon && (
                                <Badge variant="destructive" className="bg-red-600 flex gap-1 items-center px-1.5 py-0 text-[10px]">
                                    <Clock className="h-3 w-3" /> Expiring
                                </Badge>
                            )}
                            <Badge variant={isCritical ? "destructive" : isWarning ? "warning" as any : "secondary"} className={isWarning ? 'bg-amber-100 text-amber-800' : ''}>
                                {med.severity}
                            </Badge>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{med.genericName} • {med.form} {med.strength}</p>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between text-sm mb-1.5 font-medium">
                    <span className={isCritical ? 'text-red-600 font-bold' : 'text-foreground'}>Current: {med.stockAvailable} {med.unit}</span>
                    <span className="text-muted-foreground">Reorder: {med.reorderLevel}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 mb-4 overflow-hidden">
                    <div
                        className={`h-2 rounded-full ${isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-green-500'}`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 font-medium bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md">
                        <AlertTriangle className="h-3.5 w-3.5" /> Deficit: {med.deficit}
                    </span>
                    <span>₹{med.unitPrice} / {med.unit}</span>
                </div>
                {med.suggestedOrderQty !== undefined && med.suggestedOrderQty > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800/50">
                        <PackagePlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            Suggested Order: {med.suggestedOrderQty} {med.unit}
                        </span>
                    </div>
                )}
            </CardContent>
            <div className="px-6 pb-4 pt-0">
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => onRestock(med)}>
                    <Plus className="h-4 w-4" />
                    Restock
                </Button>
            </div>
        </Card>
    );
}

export function PharmacyContent() {
    const { currentUser } = useAuthStore()
    const [search, setSearch] = useState("")
    const [activeTab, setActiveTab] = useState("INVENTORY")

    const { prescriptions, isLoading, mutate } = usePrescriptions({ search })
    const { stats, mutate: mutateStats } = usePharmacyStats()
    const { lowStock, isLoading: isLowStockLoading, mutate: mutateLowStock } = useLowStockInventory()

    const [selectedOrder, setSelectedOrder] = useState<ApiPrescription | null>(null)
    const [dispensedQtys, setDispensedQtys] = useState<Record<string, number>>({})
    const [actionType, setActionType] = useState<"dispense" | "return">("dispense")
    const [submitting, setSubmitting] = useState(false)

    // Restock Modal State
    const [restockMed, setRestockMed] = useState<ApiMedication | null>(null)
    const [restockQty, setRestockQty] = useState<string>("")
    const [restockBatch, setRestockBatch] = useState<string>("")
    const [restockReason, setRestockReason] = useState<string>("")
    const [isRestocking, setIsRestocking] = useState(false)

    function openDispenseModal(order: ApiPrescription) {
        const initial: Record<string, number> = {}
        order.items.forEach(i => { initial[i.id] = i.prescribedQty - i.dispensedQty }) // Default to remaining
        setDispensedQtys(initial)
        setActionType("dispense")
        setSelectedOrder(order)
    }

    function openReturnModal(order: ApiPrescription) {
        setActionType("return")
        setSelectedOrder(order)
    }

    async function handleAction() {
        if (!selectedOrder) return
        setSubmitting(true)
        try {
            if (actionType === "dispense") {
                const items = Object.entries(dispensedQtys).map(([id, qty]) => ({ prescriptionItemId: id, dispensedQty: qty }))
                await dispensePrescription(selectedOrder.id, items)
                toast.success(`Order dispensed successfully. IP Bill updated.`)
            } else {
                await returnPrescription(selectedOrder.id, "Pharmacy initiated return")
                toast.success(`Order returned successfully. IP Bill credited.`)
            }
            await mutate()
            setSelectedOrder(null)
        } catch (err: any) {
            toast.error(err.message || `Action failed`)
        } finally {
            setSubmitting(false)
        }
    }

    const handleRestock = async () => {
        if (!restockMed) return

        const qty = parseInt(restockQty, 10)
        if (isNaN(qty) || qty <= 0) {
            toast.error("Please enter a valid positive quantity to restock.")
            return
        }

        setIsRestocking(true)
        try {
            await adjustStock(restockMed.id, {
                quantity: qty,
                batchNumber: restockBatch || undefined,
                reason: restockReason || undefined
            });

            toast.success(`Successfully restocked ${qty} ${restockMed.unit} of ${restockMed.drugName}`)

            setRestockMed(null)
            setRestockQty("")
            setRestockBatch("")
            setRestockReason("")

            // Refresh counts and grid
            mutateLowStock()
            mutateStats()
        } catch (error: any) {
            toast.error(error.message || "Failed to restock medication. Please try again.")
        } finally {
            setIsRestocking(false)
        }
    }

    // Filter local list by active tab
    const filteredPrescriptions = prescriptions.filter(o =>
        activeTab === "PENDING" ? (o.status === "PENDING" || o.status === "PARTIAL") : o.status === activeTab
    )

    // Sort: Urgent first, then oldest first
    const sortedPrescriptions = [...filteredPrescriptions].sort((a, b) => {
        if (activeTab === "PENDING") {
            const isAUrgent = a.admission?.currentBed?.ward?.type === "NICU" || a.admission?.currentBed?.ward?.type === "PICU"
            const isBUrgent = b.admission?.currentBed?.ward?.type === "NICU" || b.admission?.currentBed?.ward?.type === "PICU"
            if (isAUrgent && !isBUrgent) return -1
            if (!isAUrgent && isBUrgent) return 1
            return new Date(a.orderedAt).getTime() - new Date(b.orderedAt).getTime() // Oldest first
        }
        return new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime() // Newest first for dispensed
    })

    return (
        <div className="flex-1 space-y-6 pt-2">
            {/* Stats */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Pill className="h-4 w-4" /> Total Active</span>
                        <p className="text-2xl font-bold">{stats.totalActive}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500" /> Pending</span>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">{stats.pending + stats.partial}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Dispensed Today</span>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-500">{stats.dispensedToday}</p>
                    </CardContent>
                </Card>
                <Card className={stats.urgentCount > 0 ? "border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10" : ""}>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2"><AlertCircle className={stats.urgentCount > 0 ? "h-4 w-4 text-red-500" : "h-4 w-4"} /> Urgent (ICU)</span>
                        <p className={`text-2xl font-bold ${stats.urgentCount > 0 ? "text-red-600 dark:text-red-500" : "text-muted-foreground"}`}>{stats.urgentCount}</p>
                    </CardContent>
                </Card>
                <Card className={stats.lowStockCount > 0 ? "border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-900/10" : ""}>
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2"><AlertTriangle className={stats.lowStockCount > 0 ? "h-4 w-4 text-amber-500" : "h-4 w-4"} /> Low Stock</span>
                        <p className={`text-2xl font-bold ${stats.lowStockCount > 0 ? "text-amber-600 dark:text-amber-500" : "text-muted-foreground"}`}>{stats.lowStockCount}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                    <TabsList>
                        <TabsTrigger value="INVENTORY">Inventory</TabsTrigger>
                        <TabsTrigger value="PENDING">Pending Orders</TabsTrigger>
                        <TabsTrigger value="DISPENSED">Dispensed</TabsTrigger>
                        <TabsTrigger value="RETURNED">Returned</TabsTrigger>
                        <TabsTrigger value="LOW_STOCK" className="gap-1.5 data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 dark:data-[state=active]:bg-amber-900/40">
                            Low Stock
                            {stats.lowStockCount > 0 && <span className="bg-amber-500 text-white text-[10px] px-1.5 rounded-full">{stats.lowStockCount}</span>}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search patient, UHID, Rx Number..."
                        className="pl-8 bg-background"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            {activeTab === "INVENTORY" ? (
                <PharmacyInventoryTab />
            ) : activeTab === "LOW_STOCK" ? (
                isLowStockLoading ? (
                    <div className="py-24 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        <p className="text-muted-foreground mt-4">Loading low stock inventory...</p>
                    </div>
                ) : lowStock.length === 0 ? (
                    <div className="py-24 text-center border rounded-xl border-dashed bg-muted/20">
                        <CheckCircle className="h-10 w-10 mx-auto text-green-500/80 mb-3" />
                        <h3 className="text-lg font-medium">Inventory Healthy</h3>
                        <p className="text-muted-foreground text-sm mt-1">There are no medications currently below their reorder levels.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {lowStock.map(med => (
                            <InventoryAlertCard key={med.id} med={med} onRestock={setRestockMed} />
                        ))}
                    </div>
                )
            ) : isLoading ? (
                <div className="py-24 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground mt-4">Loading prescriptions...</p>
                </div>
            ) : sortedPrescriptions.length === 0 ? (
                <div className="py-24 text-center border rounded-xl border-dashed bg-muted/20">
                    <Pill className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                    <h3 className="text-lg font-medium">No {activeTab.toLowerCase()} orders found</h3>
                    <p className="text-muted-foreground text-sm mt-1">There are no prescriptions matching your criteria.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {sortedPrescriptions.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onAction={activeTab === "PENDING" ? openDispenseModal : openReturnModal}
                            actionLabel={activeTab === "PENDING" ? "Dispense" : activeTab === "DISPENSED" ? "Process Return" : undefined}
                            icon={activeTab === "PENDING" ? <Pill className="h-4 w-4" /> : <Undo2 className="h-4 w-4" />}
                        />
                    ))}
                </div>
            )}

            {/* Action Modal */}
            <Dialog open={!!selectedOrder} onOpenChange={open => !open && setSelectedOrder(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{actionType === "dispense" ? "Dispense Order" : "Return Order"} — {selectedOrder?.patient.firstName}</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4 py-2">
                            <p className="text-sm text-muted-foreground">
                                {actionType === "dispense"
                                    ? "Adjust quantities if partial fill. Confirming will deduct stock and post charges to the IP Bill automatically."
                                    : "Returning medications will restore stock and create a refund credit on the IP Bill."}
                            </p>

                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                                {selectedOrder.items.map(item => {
                                    const remaining = item.prescribedQty - item.dispensedQty;
                                    const showItem = actionType === "dispense" ? remaining > 0 : item.dispensedQty > 0;

                                    if (!showItem) return null;

                                    return (
                                        <div key={item.id} className="flex flex-col bg-muted/40 rounded-lg px-3 py-3 border border-transparent hover:border-border transition-colors">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{item.medication.drugName}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {item.medication.strength} · Need: {actionType === "dispense" ? remaining : item.dispensedQty} {item.medication.unit}
                                                        {actionType === "dispense" && (
                                                            <span className={`ml-2 font-medium ${item.medication.stockAvailable >= remaining ? "text-green-600 dark:text-green-500" : "text-red-500"}`}>
                                                                (Stock: {item.medication.stockAvailable})
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                {actionType === "dispense" && (
                                                    <div className="shrink-0 w-24">
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            max={item.medication.stockAvailable < remaining ? item.medication.stockAvailable : remaining}
                                                            value={dispensedQtys[item.id] ?? remaining}
                                                            onChange={e => setDispensedQtys(p => ({ ...p, [item.id]: Number(e.target.value) }))}
                                                            className="h-9 text-center"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            {(item.dose || item.frequency || item.instructions) && (
                                                <div className="mt-2 text-[11px] border-t pt-2 border-muted-foreground/10">
                                                    <div className="flex gap-3 text-muted-foreground">
                                                        {item.dose && <span><strong>Dose:</strong> {item.dose}</span>}
                                                        {item.frequency && <span><strong>Freq:</strong> {item.frequency}</span>}
                                                        {item.duration && <span><strong>Dur:</strong> {item.duration} days</span>}
                                                    </div>
                                                    {item.instructions && (
                                                        <div className="mt-1 text-blue-700 dark:text-blue-400 font-medium">
                                                            Instructions: {item.instructions}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {actionType === "dispense" && (
                                <div className="bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-300 px-3 py-2.5 rounded-md text-sm flex items-center gap-2 mt-4">
                                    <User className="h-4 w-4 shrink-0" />
                                    <span>Dispensing as <strong>{currentUser?.name || "Pharmacist"}</strong></span>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" disabled={submitting} onClick={() => setSelectedOrder(null)}>Cancel</Button>
                        <Button onClick={handleAction} disabled={submitting} className="gap-2" variant={actionType === "return" ? "destructive" : "default"}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : actionType === "return" ? <Undo2 className="h-4 w-4" /> : <Pill className="h-4 w-4" />}
                            {actionType === "dispense" ? "Confirm Dispense" : "Confirm Return"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Restock Modal */}
            <Dialog
                open={!!restockMed}
                onOpenChange={open => {
                    if (!open) {
                        setRestockMed(null)
                        setRestockQty("")
                        setRestockBatch("")
                        setRestockReason("")
                    }
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Restock Medication</DialogTitle>
                    </DialogHeader>
                    {restockMed && (
                        <div className="space-y-4 py-2">
                            <div>
                                <h4 className="font-semibold">{restockMed.drugName}</h4>
                                <p className="text-sm text-muted-foreground">{restockMed.genericName} • {restockMed.form} {restockMed.strength}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Current Stock</label>
                                    <Input value={`${restockMed.stockAvailable} ${restockMed.unit}`} disabled className="bg-muted" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Reorder Level</label>
                                    <Input value={restockMed.reorderLevel} disabled className="bg-muted" />
                                </div>
                            </div>

                            <div className="space-y-3 pt-2 border-t">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-amber-700 dark:text-amber-500 flex items-center gap-1.5 shrink-0">
                                        Quantity Received ({restockMed.unit}) *
                                    </label>
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder={`e.g. ${restockMed.deficit || 50}`}
                                        value={restockQty}
                                        onChange={(e) => setRestockQty(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Batch / Lot Number (Optional)</label>
                                    <Input
                                        placeholder="e.g. BATCH-8910"
                                        value={restockBatch}
                                        onChange={(e) => setRestockBatch(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Notes (Optional)</label>
                                    <Input
                                        placeholder="Supplier invoice reference, etc."
                                        value={restockReason}
                                        onChange={(e) => setRestockReason(e.target.value)}
                                    />
                                </div>
                            </div>

                            <DialogFooter className="mt-4 gap-2 sm:gap-0">
                                <Button variant="outline" onClick={() => setRestockMed(null)} disabled={isRestocking}>Cancel</Button>
                                <Button
                                    onClick={handleRestock}
                                    disabled={isRestocking || !restockQty}
                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                    {isRestocking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirm Restock
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
