"use client"

import { useState, useMemo } from "react"
import {
    Search,
    CreditCard,
    IndianRupee,
    CheckCircle2,
    Clock,
    AlertCircle,
    Download,
    X,
    Receipt,
    TrendingUp,
    Bed,
    Users,
    ArrowRight,
    Ban,
    FileText,
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useBillingStore } from "@/lib/store/billing-store"
import { appointments } from "@/lib/data/appointments"
import { BillWorkflowStatus, PatientBill } from "@/lib/types/billing"

// ─── Status Configuration ───────────────────────────────────────────────────
const statusConfig: Record<BillWorkflowStatus, { label: string; className: string; icon: React.ElementType }> = {
    [BillWorkflowStatus.Draft]: { label: "Draft", className: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
    [BillWorkflowStatus.Running]: { label: "Running", className: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
    [BillWorkflowStatus.PendingSettlement]: { label: "Pending Settle", className: "bg-orange-50 text-orange-700 border-orange-200", icon: AlertCircle },
    [BillWorkflowStatus.Closed]: { label: "Closed", className: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
    [BillWorkflowStatus.Voided]: { label: "Voided", className: "bg-red-50 text-red-700 border-red-200", icon: Ban },
}

function getInitials(name: string) {
    if (!name) return "?"
    const parts = name.split(" ")
    return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : name[0].toUpperCase()
}

function formatINR(amount: number) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)
}

export function BillingContent() {
    const { bills } = useBillingStore()
    const [statusFilter, setStatusFilter] = useState<BillWorkflowStatus | "all">("all")
    const [search, setSearch] = useState("")

    // Quick-card data
    const unbilledVisits = appointments.filter(a =>
        ["Completed", "In Progress", "Scheduled"].includes(a.status) &&
        !bills.some(b => b.visitId === a.id) // Guard #1: only show those without a bill
    )

    const pendingSettlements = bills.filter(b =>
        b.status === BillWorkflowStatus.PendingSettlement
    )

    const filtered = useMemo(() => {
        const q = search.toLowerCase()
        return bills.filter(b => {
            if (statusFilter !== "all" && b.status !== statusFilter) return false
            const matchesQuery = !q ||
                b.patientName.toLowerCase().includes(q) ||
                b.invoiceNumber.toLowerCase().includes(q) ||
                b.patientId.toLowerCase().includes(q)
            return matchesQuery
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [bills, statusFilter, search])

    const totals = useMemo(() => ({
        revenue: bills.reduce((s, b) => s + b.summary.totalPaid, 0),
        pending: bills.reduce((s, b) => s + b.summary.balanceDue, 0),
        closed: bills.filter(b => b.status === BillWorkflowStatus.Closed).length,
        active: bills.filter(b => b.status === BillWorkflowStatus.Running || b.status === BillWorkflowStatus.Draft).length,
    }), [bills])

    const counts = useMemo(() => ({
        all: bills.length,
        [BillWorkflowStatus.Draft]: bills.filter(b => b.status === BillWorkflowStatus.Draft).length,
        [BillWorkflowStatus.Running]: bills.filter(b => b.status === BillWorkflowStatus.Running).length,
        [BillWorkflowStatus.PendingSettlement]: bills.filter(b => b.status === BillWorkflowStatus.PendingSettlement).length,
        [BillWorkflowStatus.Closed]: bills.filter(b => b.status === BillWorkflowStatus.Closed).length,
        [BillWorkflowStatus.Voided]: bills.filter(b => b.status === BillWorkflowStatus.Voided).length,
    }), [bills])

    return (
        <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-[1600px] mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Financial Dashboard</h1>
                    <p className="text-muted-foreground text-sm">
                        Real-time billing performance and settlement tracking.
                    </p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <Button variant="outline" className="gap-2" asChild>
                        <Link href="/billing/ip">
                            <Bed className="size-4" />
                            IP Bills
                        </Link>
                    </Button>
                    <Button className="gap-2" asChild>
                        <Link href="/billing/op/new">
                            <Receipt className="size-4" />
                            New OP Bill
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Quick-Action Cards (#6) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Today's OP Visits */}
                <Card className="border-blue-100 bg-blue-50/30">
                    <CardHeader className="pb-2 pt-4 px-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                                <Users className="size-4" /> Today&apos;s OP Queue
                            </CardTitle>
                            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                                {unbilledVisits.length} visits
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-2">
                        {unbilledVisits.length === 0 ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                                <Ban className="size-4" />
                                No pending visits today
                            </div>
                        ) : (
                            <>
                                {unbilledVisits.slice(0, 4).map(a => (
                                    <div key={a.id} className="flex items-center justify-between text-sm gap-2">
                                        <span className="font-medium truncate text-foreground">{a.patientName}</span>
                                        <span className="text-muted-foreground shrink-0 text-xs">{a.doctor.replace('Dr. ', '')} &middot; {a.time}</span>
                                    </div>
                                ))}
                                {unbilledVisits.length > 4 && (
                                    <p className="text-xs text-muted-foreground">+{unbilledVisits.length - 4} more visits</p>
                                )}
                            </>
                        )}
                        <div className="pt-2">
                            <Button size="sm" variant="outline" className="w-full gap-2 border-blue-200 text-blue-700 hover:bg-blue-100" asChild>
                                <Link href="/billing/op/new">
                                    <Receipt className="size-3.5" /> Open OP Billing <ArrowRight className="size-3.5" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Pending IP Settlements */}
                <Card className="border-amber-100 bg-amber-50/30">
                    <CardHeader className="pb-2 pt-4 px-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                                <Bed className="size-4" /> Pending Settlements
                            </CardTitle>
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                                {pendingSettlements.length} patients
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-2">
                        {pendingSettlements.length === 0 ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                <Ban className="size-4 text-muted-foreground" />
                                No pending settlements
                            </div>
                        ) : pendingSettlements.slice(0, 4).map(b => (
                            <div key={b.id} className="flex items-center justify-between text-sm gap-2">
                                <span className="font-medium truncate text-foreground">{b.patientName}</span>
                                <Link
                                    href={`/billing/ip/${b.admissionId}/settlement`}
                                    className="text-amber-700 text-xs hover:underline shrink-0"
                                >
                                    Settle →
                                </Link>
                            </div>
                        ))}
                        <div className="pt-2">
                            <Button size="sm" variant="outline" className="w-full gap-2 border-amber-200 text-amber-700 hover:bg-amber-100" asChild>
                                <Link href="/billing/ip">
                                    <Bed className="size-3.5" /> View IP Ledger <ArrowRight className="size-3.5" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="py-0">
                    <CardContent className="flex items-center gap-3 px-4 py-3">
                        <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 shrink-0">
                            <IndianRupee className="size-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-foreground tabular-nums">{formatINR(totals.revenue)}</p>
                            <p className="text-[11px] text-muted-foreground">Revenue Collected</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="py-0">
                    <CardContent className="flex items-center gap-3 px-4 py-3">
                        <div className="flex items-center justify-center size-10 rounded-lg bg-[#e8f4fd] shrink-0">
                            <Clock className="size-5 text-[#1a6fb5]" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-foreground tabular-nums">{formatINR(totals.pending)}</p>
                            <p className="text-[11px] text-muted-foreground">Outstanding Due</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="py-0">
                    <CardContent className="flex items-center gap-3 px-4 py-3">
                        <div className="flex items-center justify-center size-10 rounded-lg bg-[#e6f6ee] shrink-0">
                            <CheckCircle2 className="size-5 text-[#1a7a4c]" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-foreground tabular-nums">{totals.closed}</p>
                            <p className="text-[11px] text-muted-foreground">Closed Invoices</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="py-0">
                    <CardContent className="flex items-center gap-3 px-4 py-3">
                        <div className="flex items-center justify-center size-10 rounded-lg bg-[#fde8e8] shrink-0">
                            <TrendingUp className="size-5 text-[#c53030]" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-foreground tabular-nums">{totals.active}</p>
                            <p className="text-[11px] text-muted-foreground">Active Drafts/Running</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Status Filter Chips + Search */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-wrap gap-2">
                    {(["all", ...Object.values(BillWorkflowStatus)] as const).map(s => {
                        const isActive = statusFilter === s
                        const count = s === "all" ? counts.all : counts[s]
                        const label = s === "all" ? "All" : statusConfig[s].label
                        return (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(isActive && s !== "all" ? "all" : s)}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                                    isActive ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                                )}
                            >
                                {label}
                                <span className={cn(
                                    "flex items-center justify-center size-5 rounded-full text-[10px] font-bold",
                                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                                )}>
                                    {count}
                                </span>
                            </button>
                        )
                    })}
                </div>
                <div className="relative sm:w-64 ml-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                        type="search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search invoice or patient..."
                        className="w-full h-9 pl-9 pr-8 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <X className="size-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Billing Table */}
            <Card className="py-0 overflow-hidden border-none shadow-none bg-transparent">
                <div className="overflow-x-auto border rounded-xl bg-card">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b border-border bg-muted/40">
                                {["Invoice", "Patient", "Dept/Doctor", "Items", "Total", "Due", "Status", ""].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-muted/50 rounded-full">
                                                <FileText className="size-8 text-muted-foreground/40" />
                                            </div>
                                            <div className="max-w-[200px]">
                                                <p className="font-semibold text-foreground text-sm">No records found</p>
                                                <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search query.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(b => {
                                    const sc = statusConfig[b.status]
                                    const Icon = sc.icon
                                    return (
                                        <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors group">
                                            <td className="px-4 py-4">
                                                <p className="text-xs font-mono font-medium text-foreground">{b.invoiceNumber}</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(b.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="size-8 shrink-0 border border-border">
                                                        <AvatarFallback className="text-[10px] font-bold bg-muted text-muted-foreground">
                                                            {getInitials(b.patientName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground truncate max-w-[150px]">{b.patientName}</p>
                                                        <p className="text-[10px] text-muted-foreground">{b.patientId}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-xs text-foreground font-medium">{b.department || "—"}</p>
                                                <p className="text-[10px] text-muted-foreground">{b.doctorName || "—"}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-1 max-w-[120px]">
                                                    <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-muted hover:bg-muted/80">{b.items.length} Items</Badge>
                                                    <span className="text-[9px] text-muted-foreground italic">{b.type} Bill</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-sm font-bold text-foreground tabular-nums">{formatINR(b.summary.netTotal)}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className={cn(
                                                    "text-sm font-bold tabular-nums",
                                                    b.summary.balanceDue > 0 ? "text-orange-600" : "text-green-600"
                                                )}>
                                                    {formatINR(b.summary.balanceDue)}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <Badge
                                                    variant="outline"
                                                    className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md gap-1.5 uppercase tracking-wider", sc.className)}
                                                >
                                                    <Icon className="size-3" />
                                                    {sc.label}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {b.status === BillWorkflowStatus.Closed ? (
                                                        <Button variant="ghost" size="icon" className="size-8 rounded-full" asChild>
                                                            <Link href={`/billing/invoice/${b.id}`}>
                                                                <FileText className="size-4 text-primary" />
                                                            </Link>
                                                        </Button>
                                                    ) : b.type === 'IP' ? (
                                                        <Button variant="ghost" size="icon" className="size-8 rounded-full" asChild>
                                                            <Link href={`/billing/ip/${b.admissionId}`}>
                                                                <ArrowRight className="size-4 text-muted-foreground" />
                                                            </Link>
                                                        </Button>
                                                    ) : (
                                                        <Button variant="ghost" size="icon" className="size-8 rounded-full" asChild>
                                                            <Link href="/billing/op/new">
                                                                <ArrowRight className="size-4 text-muted-foreground" />
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
