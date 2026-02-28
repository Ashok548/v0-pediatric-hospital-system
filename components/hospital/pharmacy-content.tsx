"use client"

import { useState } from "react"
import { usePharmacyStore, type DispensedItemInput } from "@/lib/store/pharmacy-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Pill, CheckCircle, Clock, User, BedDouble, AlertCircle } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import type { PharmacyOrder } from "@/lib/data/pharmacy"

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
    partial: { label: "Partial", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
    dispensed: { label: "Dispensed", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
    returned: { label: "Returned", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300" },
}

function OrderCard({ order, onDispense }: { order: PharmacyOrder; onDispense: (order: PharmacyOrder) => void }) {
    const cfg = STATUS_CONFIG[order.status]
    const timeAgo = formatDistanceToNow(new Date(order.orderedAt), { addSuffix: true })
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="font-semibold">{order.patientName}</p>
                        <p className="text-xs text-muted-foreground">{order.patientId}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.color}`}>
                        {cfg.label}
                    </span>
                </div>
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />{order.doctorName}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <BedDouble className="h-3.5 w-3.5" />{order.wardBed}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />Ordered {timeAgo}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {order.notes && (
                    <div className="flex items-center gap-1.5 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-md px-2 py-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />{order.notes}
                    </div>
                )}
                <div className="space-y-1">
                    {order.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-sm bg-muted/30 rounded-md px-2.5 py-1.5">
                            <span className="font-medium truncate">{item.drugName}</span>
                            <span className="text-muted-foreground ml-2 shrink-0 text-xs">
                                {order.status === "dispensed" ? `${item.dispensedQty}` : `${item.prescribedQty}`} {item.unit}
                            </span>
                        </div>
                    ))}
                </div>
                {order.status !== "dispensed" && (
                    <Button className="w-full gap-2 mt-1" size="sm" onClick={() => onDispense(order)}>
                        <Pill className="h-4 w-4" /> Dispense Order
                    </Button>
                )}
                {order.status === "dispensed" && (
                    <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 rounded-md px-2 py-1.5">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Dispensed by {order.dispensedBy} · {order.dispensedAt && format(new Date(order.dispensedAt), "dd MMM, HH:mm")}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export function PharmacyContent() {
    const { orders, pendingOrders, dispensedOrders, dispenseOrder } = usePharmacyStore()
    const [selectedOrder, setSelectedOrder] = useState<PharmacyOrder | null>(null)
    const [dispensedQtys, setDispensedQtys] = useState<Record<string, number>>({})
    const [dispensedBy, setDispensedBy] = useState("")

    function openDispenseModal(order: PharmacyOrder) {
        const initial: Record<string, number> = {}
        order.items.forEach(i => { initial[i.id] = i.prescribedQty })
        setDispensedQtys(initial)
        setDispensedBy("")
        setSelectedOrder(order)
    }

    function handleDispense() {
        if (!selectedOrder) return
        const items: DispensedItemInput[] = Object.entries(dispensedQtys).map(([itemId, dispensedQty]) => ({ itemId, dispensedQty }))
        const result = dispenseOrder(selectedOrder.id, items, dispensedBy || "Pharmacist")
        if (result.success) {
            toast.success(`Order ${selectedOrder.id} dispensed. Charges posted to IP Bill.`)
            setSelectedOrder(null)
        } else {
            toast.error(result.error ?? "Failed to dispense")
        }
    }

    return (
        <div className="flex-1 space-y-6 p-6 pt-4">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Pharmacy</h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                    Manage prescription orders and dispense medications to wards
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Pill className="h-4 w-4" /> Total Orders
                        </CardTitle>
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold">{orders.length}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" /> Pending
                        </CardTitle>
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold text-amber-600">{pendingOrders.length}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" /> Dispensed Today
                        </CardTitle>
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold text-green-600">{dispensedOrders.length}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500" /> Urgent
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-red-600">
                            {pendingOrders.filter(o => o.wardBed.includes("ICU")).length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Order Lists */}
            <Tabs defaultValue="pending">
                <TabsList>
                    <TabsTrigger value="pending">
                        Pending <Badge variant="secondary" className="ml-2">{pendingOrders.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="dispensed">
                        Dispensed <Badge variant="secondary" className="ml-2">{dispensedOrders.length}</Badge>
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="pending">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-4">
                        {pendingOrders.map(order => (
                            <OrderCard key={order.id} order={order} onDispense={openDispenseModal} />
                        ))}
                        {pendingOrders.length === 0 && (
                            <div className="col-span-full text-center text-muted-foreground py-12">
                                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                                All orders dispensed!
                            </div>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="dispensed">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-4">
                        {dispensedOrders.map(order => (
                            <OrderCard key={order.id} order={order} onDispense={openDispenseModal} />
                        ))}
                        {dispensedOrders.length === 0 && (
                            <div className="col-span-full text-center text-muted-foreground py-12">No dispensed orders yet.</div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Dispense Modal */}
            <Dialog open={!!selectedOrder} onOpenChange={open => !open && setSelectedOrder(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Dispense Order — {selectedOrder?.patientName}</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4 py-2">
                            <p className="text-sm text-muted-foreground">
                                Adjust dispensed quantities if partial. Confirming will post charges to the IP Bill.
                            </p>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {selectedOrder.items.map(item => (
                                    <div key={item.id} className="flex items-center justify-between gap-4 bg-muted/30 rounded-lg px-3 py-2.5">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{item.drugName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.strength} · Prescribed: {item.prescribedQty} {item.unit}
                                                <span className={`ml-2 ${item.stockAvailable > 0 ? "text-green-600" : "text-red-600"}`}>
                                                    (Stock: {item.stockAvailable})
                                                </span>
                                            </p>
                                        </div>
                                        <div className="shrink-0 w-24">
                                            <Input
                                                type="number"
                                                min={0}
                                                max={item.prescribedQty}
                                                value={dispensedQtys[item.id] ?? item.prescribedQty}
                                                onChange={e => setDispensedQtys(p => ({ ...p, [item.id]: Number(e.target.value) }))}
                                                className="h-8 text-center"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-1">
                                <Label>Dispensed By</Label>
                                <Input
                                    value={dispensedBy}
                                    onChange={e => setDispensedBy(e.target.value)}
                                    placeholder="Pharmacist name"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedOrder(null)}>Cancel</Button>
                        <Button onClick={handleDispense} className="gap-2">
                            <Pill className="h-4 w-4" /> Confirm Dispense
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
