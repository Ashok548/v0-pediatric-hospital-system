"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
    FlaskConical,
    Search,
    Clock,
    CheckCircle2,
    AlertTriangle,
    CalendarDays,
    ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useLabOrders } from "@/lib/api/labs"

type OrderStatus = "PENDING" | "PARTIAL" | "FINALIZED" | "ALL"

export function LabDashboardContent() {
    const { orders, isLoading } = useLabOrders()
    const [statusFilter, setStatusFilter] = useState<OrderStatus>("ALL")
    const [search, setSearch] = useState("")

    const counts = useMemo(() => {
        if (!orders) return { PENDING: 0, PARTIAL: 0, FINALIZED: 0 }
        return {
            PENDING: orders.filter((o: any) => o.status === "PENDING").length,
            PARTIAL: orders.filter((o: any) => o.status === "PARTIAL").length,
            FINALIZED: orders.filter((o: any) => o.status === "FINALIZED").length,
        }
    }, [orders])

    const filteredOrders = useMemo(() => {
        if (!orders) return []
        const q = search.toLowerCase()
        return orders.filter((o: any) => {
            if (statusFilter !== "ALL" && o.status !== statusFilter) return false
            const patientName = `${o.patient?.firstName || ''} ${o.patient?.lastName || ''}`.toLowerCase()
            const uhid = (o.patient?.uhid || '').toLowerCase()
            const orderNum = (o.orderNumber || '').toLowerCase()

            if (q && !patientName.includes(q) && !uhid.includes(q) && !orderNum.includes(q)) return false
            return true
        })
    }, [statusFilter, search, orders])

    return (
        <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-[1600px] mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight">Laboratory Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} &middot; {orders?.length || 0} active orders
                    </p>
                </div>
                <Button className="gap-2 shrink-0">
                    <FlaskConical className="size-4" />
                    New Lab Order
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: "Pending Collection", value: counts.PENDING, icon: Clock, iconColor: "text-[#1a6fb5]", iconBg: "bg-[#e8f4fd]", filter: "PENDING" as OrderStatus },
                    { label: "Awaiting Results", value: counts.PARTIAL, icon: AlertTriangle, iconColor: "text-[#d97706]", iconBg: "bg-[#fef3c7]", filter: "PARTIAL" as OrderStatus },
                    { label: "Finalized", value: counts.FINALIZED, icon: CheckCircle2, iconColor: "text-primary", iconBg: "bg-primary/10", filter: "FINALIZED" as OrderStatus },
                    { label: "All Orders", value: orders?.length || 0, icon: CalendarDays, iconColor: "text-muted-foreground", iconBg: "bg-muted", filter: "ALL" as OrderStatus },
                ].map(stat => (
                    <button
                        key={stat.label}
                        onClick={() => setStatusFilter(stat.filter)}
                        className={cn(
                            "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all text-left w-full",
                            statusFilter === stat.filter
                                ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                                : "border-border bg-card hover:border-primary/20"
                        )}
                    >
                        <div className={cn("flex items-center justify-center size-10 rounded-lg shrink-0", stat.iconBg)}>
                            <stat.icon className={cn("size-5", stat.iconColor)} />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-foreground tabular-nums">{stat.value}</p>
                            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                        </div>
                    </button>
                ))}
            </div>

            <Card className="flex flex-col flex-1 min-h-[500px] border-border/50 shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 lg:p-5 border-b border-border/50 bg-muted/20">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by Patient Name, UHID, or Order No..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full p-10 text-muted-foreground space-y-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p>Loading lab orders...</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-10 text-muted-foreground space-y-2">
                            <FlaskConical className="size-10 text-muted-foreground/30 mb-2" />
                            <p className="text-sm font-medium">No lab orders found</p>
                            <p className="text-xs text-muted-foreground/70">Try adjusting your search or filters.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left relative">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-5 py-3 font-medium border-b border-border/50 w-[250px]">Lab Order</th>
                                    <th className="px-5 py-3 font-medium border-b border-border/50">Patient</th>
                                    <th className="px-5 py-3 font-medium border-b border-border/50">Ordered By</th>
                                    <th className="px-5 py-3 font-medium border-b border-border/50">Tests</th>
                                    <th className="px-5 py-3 font-medium border-b border-border/50">Status</th>
                                    <th className="px-5 py-3 font-medium border-b border-border/50 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filteredOrders.map((order: any) => (
                                    <tr key={order.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-5 py-3.5">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-foreground">{order.orderNumber}</span>
                                                <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Clock className="size-3" />
                                                    {new Date(order.orderDate).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-8 shrink-0">
                                                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                                                        {order.patient?.firstName?.[0]}{order.patient?.lastName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-medium text-foreground truncate">
                                                        {order.patient?.firstName} {order.patient?.lastName}
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground">
                                                        UHID: {order.patient?.uhid}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-sm font-medium">{order.doctor?.name || 'Dr. Unknown'}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {order.panels?.slice(0, 2).map((p: any) => (
                                                    <Badge key={p.id} variant="secondary" className="text-[10px] font-normal rounded-md">
                                                        {p.panelName}
                                                    </Badge>
                                                ))}
                                                {order.panels?.length > 2 && (
                                                    <Badge variant="outline" className="text-[10px] font-normal rounded-md">
                                                        +{order.panels.length - 2} more
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {order.status === "PENDING" && (
                                                <Badge variant="secondary" className="text-[10px] bg-sky-50 text-sky-700 hover:bg-sky-50 border-sky-200">
                                                    Pending
                                                </Badge>
                                            )}
                                            {order.status === "PARTIAL" && (
                                                <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200">
                                                    Partial
                                                </Badge>
                                            )}
                                            {order.status === "FINALIZED" && (
                                                <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200">
                                                    Finalized
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <Link href={`/lab/${order.id}`}>
                                                <Button size="sm" variant="ghost" className="h-8 group-hover:bg-background">
                                                    View Details
                                                    <ChevronRight className="size-3.5 ml-1" />
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>
        </div>
    )
}
