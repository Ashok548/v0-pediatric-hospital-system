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
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { bills } from "@/lib/data/billing"
import type { Bill, BillStatus, PaymentMode } from "@/lib/data/types"

// ─── Types ─────────────────────────────────────────────────────────────────
// Bill, BillStatus, PaymentMode types are imported from @/lib/data/types
// Data is imported from @/lib/data/billing

const statusConfig: Record<BillStatus, { label: string; className: string; icon: React.ElementType }> = {
    Paid: { label: "Paid", className: "bg-[#e6f6ee] text-[#1a7a4c] border-[#b4e4cb]", icon: CheckCircle2 },
    Pending: { label: "Pending", className: "bg-[#e8f4fd] text-[#1a6fb5] border-[#bcddf5]", icon: Clock },
    Partial: { label: "Partial", className: "bg-[#fff8e1] text-[#e65100] border-[#ffcc80]", icon: Clock },
    Overdue: { label: "Overdue", className: "bg-[#fde8e8] text-[#c53030] border-[#f5bcbc]", icon: AlertCircle },
}

const paymentModeColors: Record<PaymentMode, string> = {
    Cash: "text-[#1a7a4c] bg-[#e6f6ee]",
    Card: "text-[#1a6fb5] bg-[#e8f4fd]",
    UPI: "text-[#6d28d9] bg-[#ede9fe]",
    Insurance: "text-[#92400e] bg-[#fef3c7]",
}

function getInitials(name: string) {
    const parts = name.split(" ")
    return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : name[0].toUpperCase()
}

function formatINR(amount: number) {
    return new Intl.NumberFormat("en-IN").format(amount)
}

// ─── Component ──────────────────────────────────────────────────────────────
export function BillingContent() {
    const [statusFilter, setStatusFilter] = useState<BillStatus | "all">("all")
    const [search, setSearch] = useState("")

    const filtered = useMemo(() => {
        const q = search.toLowerCase()
        return bills.filter(b => {
            if (statusFilter !== "all" && b.status !== statusFilter) return false
            if (q && !b.patientName.toLowerCase().includes(q) && !b.invoiceNo.toLowerCase().includes(q) && !b.uhid.toLowerCase().includes(q)) return false
            return true
        })
    }, [statusFilter, search])

    const totals = useMemo(() => ({
        revenue: bills.reduce((s, b) => s + b.paidAmount, 0),
        pending: bills.reduce((s, b) => s + (b.totalAmount - b.paidAmount), 0),
        paid: bills.filter(b => b.status === "Paid").length,
        overdue: bills.filter(b => b.status === "Overdue").length,
    }), [])

    const counts = useMemo(() => ({
        all: bills.length,
        Paid: bills.filter(b => b.status === "Paid").length,
        Pending: bills.filter(b => b.status === "Pending").length,
        Partial: bills.filter(b => b.status === "Partial").length,
        Overdue: bills.filter(b => b.status === "Overdue").length,
    }), [])

    return (
        <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-[1600px] mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight">Billing</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        22 Feb 2026 &middot; {bills.length} invoices generated today
                    </p>
                </div>
                <Button className="gap-2 shrink-0">
                    <Receipt className="size-4" />
                    New Invoice
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="py-0">
                    <CardContent className="flex items-center gap-3 px-4 py-3">
                        <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 shrink-0">
                            <IndianRupee className="size-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-foreground tabular-nums">₹{formatINR(totals.revenue)}</p>
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
                            <p className="text-lg font-bold text-foreground tabular-nums">₹{formatINR(totals.pending)}</p>
                            <p className="text-[11px] text-muted-foreground">Pending Amount</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="py-0">
                    <CardContent className="flex items-center gap-3 px-4 py-3">
                        <div className="flex items-center justify-center size-10 rounded-lg bg-[#e6f6ee] shrink-0">
                            <CheckCircle2 className="size-5 text-[#1a7a4c]" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-foreground tabular-nums">{totals.paid}</p>
                            <p className="text-[11px] text-muted-foreground">Bills Cleared</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="py-0">
                    <CardContent className="flex items-center gap-3 px-4 py-3">
                        <div className="flex items-center justify-center size-10 rounded-lg bg-[#fde8e8] shrink-0">
                            <AlertCircle className="size-5 text-[#c53030]" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-foreground tabular-nums">{totals.overdue}</p>
                            <p className="text-[11px] text-muted-foreground">Overdue Bills</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Breakdown Mini */}
            <Card className="py-0">
                <CardContent className="px-4 py-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Collection Progress</span>
                        <div className="flex items-center gap-1 text-xs text-primary font-semibold">
                            <TrendingUp className="size-3.5" />
                            +18.3% vs last week
                        </div>
                    </div>
                    <div className="flex gap-1 h-2.5 rounded-full overflow-hidden bg-muted">
                        {[
                            { color: "bg-[#1a7a4c]", pct: Math.round((bills.filter(b => b.status === "Paid").length / bills.length) * 100) },
                            { color: "bg-[#e65100]", pct: Math.round((bills.filter(b => b.status === "Partial").length / bills.length) * 100) },
                            { color: "bg-[#1a6fb5]", pct: Math.round((bills.filter(b => b.status === "Pending").length / bills.length) * 100) },
                            { color: "bg-[#c53030]", pct: Math.round((bills.filter(b => b.status === "Overdue").length / bills.length) * 100) },
                        ].map((seg, i) => (
                            <div key={i} className={cn("h-full transition-all", seg.color)} style={{ width: `${seg.pct}%` }} />
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {[
                            { color: "bg-[#1a7a4c]", label: "Paid" },
                            { color: "bg-[#e65100]", label: "Partial" },
                            { color: "bg-[#1a6fb5]", label: "Pending" },
                            { color: "bg-[#c53030]", label: "Overdue" },
                        ].map(l => (
                            <div key={l.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <span className={cn("size-2 rounded-full", l.color)} />
                                {l.label}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Status Filter Chips + Search */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-wrap gap-2">
                    {(["all", "Paid", "Partial", "Pending", "Overdue"] as const).map(s => {
                        const isActive = statusFilter === s
                        const count = s === "all" ? counts.all : counts[s]
                        return (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(isActive && s !== "all" ? "all" : s)}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                                    isActive ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                                )}
                            >
                                {s === "all" ? "All" : s}
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
            <Card className="py-0 overflow-hidden">
                <CardHeader className="px-4 py-3 border-b border-border bg-muted/30">
                    <CardTitle className="text-sm font-semibold text-foreground">
                        Showing {filtered.length} of {bills.length} invoices
                    </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b border-border bg-muted/40">
                                {["Invoice", "Patient", "Department", "Services", "Amount", "Mode", "Status", ""].map(h => (
                                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-14">
                                        <div className="flex flex-col items-center gap-2">
                                            <CreditCard className="size-9 text-muted-foreground/30" />
                                            <p className="text-sm text-muted-foreground">No invoices found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(b => {
                                    const sc = statusConfig[b.status]
                                    const Icon = sc.icon
                                    const balance = b.totalAmount - b.paidAmount
                                    return (
                                        <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors group">
                                            <td className="px-4 py-3">
                                                <p className="text-xs font-mono font-medium text-foreground">{b.invoiceNo}</p>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">{b.date}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <Avatar className="size-8 shrink-0">
                                                        <AvatarFallback className={cn(
                                                            "text-[11px] font-semibold",
                                                            b.gender === "F" ? "bg-[#fce4ec] text-[#c2185b]" : "bg-[#e3f2fd] text-[#1565c0]"
                                                        )}>
                                                            {getInitials(b.patientName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">{b.patientName}</p>
                                                        <p className="text-[11px] text-muted-foreground">{b.uhid}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-muted-foreground">{b.department}</span>
                                            </td>
                                            <td className="px-4 py-3 max-w-[180px]">
                                                <div className="flex flex-wrap gap-1">
                                                    {b.services.slice(0, 2).map(s => (
                                                        <span key={s} className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{s}</span>
                                                    ))}
                                                    {b.services.length > 2 && (
                                                        <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">+{b.services.length - 2}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-semibold text-foreground tabular-nums">₹{formatINR(b.totalAmount)}</p>
                                                {balance > 0 && (
                                                    <p className="text-[11px] text-[#c53030] tabular-nums">Due: ₹{formatINR(balance)}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {b.paymentMode ? (
                                                    <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", paymentModeColors[b.paymentMode])}>
                                                        {b.paymentMode}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full gap-1", sc.className)}>
                                                    <Icon className="size-3" />
                                                    {sc.label}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="ghost" size="sm" className="size-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Download className="size-3.5" />
                                                </Button>
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
