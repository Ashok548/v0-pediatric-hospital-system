"use client"

import { useState } from "react"
import {
    Search,
    IndianRupee,
    CheckCircle2,
    Clock,
    AlertCircle,
    X,
    Receipt,
    TrendingUp,
    Bed,
    Users,
    ArrowRight,
    Ban,
    FileText,
    Loader2,
    Wallet,
    Timer
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useBills, useBillingStats } from "@/lib/api/billing"
import { BillStatus, MappedBillStatusColors } from "@/lib/types/billing"

// ─── Status Configuration ───────────────────────────────────────────────────
const statusConfig: Record<BillStatus, { label: string; className: string; icon: React.ElementType }> = {
    'DRAFT': { ...MappedBillStatusColors['DRAFT'], icon: Clock },
    'FINAL': { ...MappedBillStatusColors['FINAL'], icon: Clock },
    'PARTIALLY_PAID': { ...MappedBillStatusColors['PARTIALLY_PAID'], icon: AlertCircle },
    'CANCELLED': { ...MappedBillStatusColors['CANCELLED'], icon: Ban },
    'PAID': { ...MappedBillStatusColors['PAID'], icon: CheckCircle2 },
}

const paymentModeColors: Record<string, string> = {
    CASH: "bg-emerald-500",
    CARD: "bg-blue-500",
    UPI: "bg-purple-500",
    ONLINE: "bg-sky-500",
    INSURANCE: "bg-amber-500",
    CHEQUE: "bg-slate-500"
}

function getInitials(name?: string) {
    if (!name) return "?"
    const parts = name.split(" ")
    return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : name[0].toUpperCase()
}

function formatINR(amount: number) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)
}

export function BillingContent() {
    const [statusFilter, setStatusFilter] = useState<BillStatus | "all">("all")
    const [search, setSearch] = useState("")
    const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today')

    // Fetch Stats using new API
    const { stats, isLoading: isStatsLoading } = useBillingStats(period)

    // Fetch Table Data
    const { bills, isLoading } = useBills({
        limit: 50,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search || undefined
    })

    const periodLabel = period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month';

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
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <div className="flex bg-muted p-1 rounded-lg border mr-2">
                        {(['today', 'week', 'month'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all",
                                    period === p ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
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

            {/* Quick-Action & Alert Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-blue-100 bg-blue-50/30 md:col-span-1">
                    <CardHeader className="pb-2 pt-4 px-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                                <Users className="size-4" /> Patient Billing Split
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        {isStatsLoading ? (
                            <div className="animate-pulse h-10 bg-blue-100 rounded-md" />
                        ) : (
                            <div className="flex items-center justify-between mt-2">
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-semibold uppercase">OP Revenue</p>
                                    <p className="text-lg font-bold text-foreground">{formatINR(stats?.billTypeSplit.op.revenue || 0)}</p>
                                    <p className="text-[10px] text-muted-foreground">{stats?.billTypeSplit.op.count || 0} bills</p>
                                </div>
                                <div className="h-8 w-px bg-border mx-2"></div>
                                <div className="text-right">
                                    <p className="text-[10px] text-muted-foreground font-semibold uppercase">IP Revenue</p>
                                    <p className="text-lg font-bold text-foreground">{formatINR(stats?.billTypeSplit.ip.revenue || 0)}</p>
                                    <p className="text-[10px] text-muted-foreground">{stats?.billTypeSplit.ip.count || 0} bills</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-amber-100 bg-amber-50/30 md:col-span-2">
                    <CardHeader className="pb-2 pt-4 px-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                                <Bed className="size-4" /> Needs Attention
                            </CardTitle>
                            {stats?.alerts && stats.alerts.overdueBills > 0 && (
                                <Badge variant="destructive" className="animate-pulse">
                                    <Timer className="size-3 mr-1" /> {stats.alerts.overdueBills} Overdue
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 flex items-center justify-between">
                        <div className="flex gap-6">
                            <div>
                                <p className="text-[10px] text-amber-700 font-semibold uppercase">Pending IP Settlements</p>
                                <p className="text-xl font-bold text-amber-900">{stats?.alerts?.pendingSettlements || 0}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-amber-700 font-semibold uppercase">Open Drafts</p>
                                <p className="text-xl font-bold text-amber-900">{stats?.alerts?.draftBills || 0}</p>
                            </div>
                        </div>
                        <Button size="sm" variant="outline" className="gap-2 border-amber-200 text-amber-700 hover:bg-amber-100" asChild>
                            <Link href="/billing/ip">
                                View IP Queue <ArrowRight className="size-3.5" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="py-0 relative overflow-hidden">
                    <CardContent className="flex items-center gap-3 px-4 py-3 relative z-10">
                        <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 shrink-0">
                            <IndianRupee className="size-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-foreground tabular-nums">
                                {isStatsLoading ? "..." : formatINR(stats?.totals.revenue || 0)}
                            </p>
                            <div className="flex items-center gap-1.5 opacity-80 mt-0.5">
                                <p className="text-[11px] text-muted-foreground whitespace-nowrap">Revenue Collected</p>
                                <span className="text-[9px] font-medium border border-border/50 text-muted-foreground bg-muted/30 px-1 py-0 rounded">{periodLabel}</span>
                            </div>
                        </div>
                    </CardContent>
                    {!isStatsLoading && stats?.paymentModes && (
                        <div className="absolute bottom-0 left-0 right-0 flex h-1.5 opacity-80">
                            {Object.entries(stats.paymentModes).map(([mode, amt]) => {
                                if (amt === 0) return null;
                                const total = stats.totals.revenue || 1;
                                return (
                                    <div
                                        key={mode}
                                        className={paymentModeColors[mode] || "bg-border"}
                                        style={{ width: `${(amt / total) * 100}%` }}
                                        title={`${mode}: ${formatINR(amt)}`}
                                    />
                                );
                            })}
                        </div>
                    )}
                </Card>
                <Card className="py-0">
                    <CardContent className="flex items-center gap-3 px-4 py-3">
                        <div className="flex items-center justify-center size-10 rounded-lg bg-[#e8f4fd] shrink-0">
                            <Wallet className="size-5 text-[#1a6fb5]" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-foreground tabular-nums">
                                {isStatsLoading ? "..." : formatINR(stats?.totals.outstanding || 0)}
                            </p>
                            <div className="flex items-center gap-1.5 opacity-80 mt-0.5">
                                <p className="text-[11px] text-muted-foreground whitespace-nowrap">Outstanding Due</p>
                                <span className="text-[9px] font-medium border border-border/50 text-muted-foreground bg-muted/30 px-1 py-0 rounded">{periodLabel}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="py-0">
                    <CardContent className="flex items-center gap-3 px-4 py-3">
                        <div className="flex items-center justify-center size-10 rounded-lg bg-[#e6f6ee] shrink-0">
                            <CheckCircle2 className="size-5 text-[#1a7a4c]" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-foreground tabular-nums">
                                {isStatsLoading ? "..." : (stats?.counts.PAID || 0)}
                            </p>
                            <div className="flex items-center gap-1.5 opacity-80 mt-0.5">
                                <p className="text-[11px] text-muted-foreground whitespace-nowrap">Fully Paid Invoices</p>
                                <span className="text-[9px] font-medium border border-border/50 text-muted-foreground bg-muted/30 px-1 py-0 rounded">{periodLabel}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="py-0">
                    <CardContent className="flex items-center gap-3 px-4 py-3">
                        <div className="flex items-center justify-center size-10 rounded-lg bg-[#fde8e8] shrink-0">
                            <TrendingUp className="size-5 text-[#c53030]" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-foreground tabular-nums">
                                {isStatsLoading ? "..." : ((stats?.counts.DRAFT || 0) + (stats?.counts.FINAL || 0))}
                            </p>
                            <div className="flex items-center gap-1.5 opacity-80 mt-0.5">
                                <p className="text-[11px] text-muted-foreground whitespace-nowrap">Active Drafts/Final</p>
                                <span className="text-[9px] font-medium border border-border/50 text-muted-foreground bg-muted/30 px-1 py-0 rounded">{periodLabel}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Status Filter Chips + Search */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-wrap gap-2">
                    {(["all", ...Object.keys(statusConfig)] as const).map((s) => {
                        const count = isStatsLoading ? 0 : (s === "all" ? stats?.counts.all : stats?.counts[s as BillStatus]);
                        const label = s === "all" ? "All" : statusConfig[s as BillStatus].label
                        const isActive = statusFilter === s
                        return (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(isActive && s !== "all" ? "all" : s as BillStatus | "all")}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                                    isActive ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground",
                                    isStatsLoading && "opacity-50 pointer-events-none"
                                )}
                            >
                                {label}
                                <span className={cn(
                                    "flex items-center justify-center size-5 rounded-full text-[10px] font-bold",
                                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                                )}>
                                    {count || 0}
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
                        placeholder="Search invoices..."
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
                <div className="overflow-x-auto border rounded-xl bg-card relative min-h-[300px]">
                    {isLoading && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                            <Loader2 className="animate-spin text-primary size-8" />
                        </div>
                    )}
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b border-border bg-muted/40">
                                {["Invoice / Date", "Patient Details", "Dept / Doctor", "Total Value", "Outstanding", "Status", ""].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {!isLoading && bills.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-20">
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
                                bills.map(b => {
                                    const sc = statusConfig[b.status] || { label: b.status, className: "bg-muted text-foreground", icon: AlertCircle }
                                    const Icon = sc.icon
                                    const pName = b.patient ? `${b.patient.firstName} ${b.patient.lastName}` : "Unknown"
                                    const pUhID = b.patient?.uhid || "N/A"
                                    const dept = b.admission?.department || "Outpatient"
                                    const isIp = !!b.admissionId

                                    return (
                                        <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors group">
                                            <td className="px-4 py-4">
                                                <p className="text-xs font-mono font-medium text-foreground">{b.billNumber}</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="size-8 shrink-0 border border-border">
                                                        <AvatarFallback className="text-[10px] font-bold bg-muted text-muted-foreground">
                                                            {getInitials(pName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground truncate max-w-[150px]">{pName}</p>
                                                        <div className="flex gap-2">
                                                            <span className="text-[10px] text-muted-foreground">{pUhID}</span>
                                                            <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4">{isIp ? 'IP' : 'OP'}</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-xs text-foreground font-medium">{dept}</p>
                                                <p className="text-[10px] text-muted-foreground">{(b as any).doctorName || "—"}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-sm font-bold text-foreground tabular-nums">{formatINR(Number(b.netAmount))}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className={cn(
                                                    "text-sm font-bold tabular-nums",
                                                    Number(b.dueAmount) > 0 ? "text-orange-600" : "text-green-600"
                                                )}>
                                                    {formatINR(Number(b.dueAmount))}
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
                                                <div className="flex justify-end gap-1 opacity-100 transition-opacity">
                                                    {b.status === "PAID" || b.status === "PARTIALLY_PAID" ? (
                                                        <Button variant="ghost" size="icon" className="size-8 rounded-full" asChild>
                                                            <Link href={`/billing/invoice/${b.id}`}>
                                                                <FileText className="size-4 text-primary" />
                                                            </Link>
                                                        </Button>
                                                    ) : isIp ? (
                                                        <Button variant="ghost" size="icon" className="size-8 rounded-full" asChild>
                                                            <Link href={`/billing/ip/${b.admissionId}/settlement`}>
                                                                <ArrowRight className="size-4 text-muted-foreground" />
                                                            </Link>
                                                        </Button>
                                                    ) : (
                                                        <Button variant="ghost" size="icon" className="size-8 rounded-full" asChild>
                                                            <Link href={`/billing/op/${b.id}`}>
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
