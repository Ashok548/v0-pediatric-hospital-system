"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Search, FileText, Printer, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBills } from "@/lib/api/billing"
import { BillStatus, MappedBillStatusColors } from "@/lib/types/billing"

const STATUS_OPTIONS: { label: string; value: string }[] = [
    { label: "All Statuses", value: "ALL" },
    { label: "Draft", value: "DRAFT" },
    { label: "Final", value: "FINAL" },
    { label: "Partially Paid", value: "PARTIALLY_PAID" },
    { label: "Paid", value: "PAID" },
    { label: "Cancelled", value: "CANCELLED" },
]

export default function OPBillsListPage() {
    const router = useRouter()
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState("ALL")
    const [page, setPage] = useState(1)

    const { bills, total, isLoading } = useBills({
        search: search || undefined,
        status: status !== "ALL" ? status as BillStatus : undefined,
        page,
        limit: 15,
    })

    // Filter client-side to only show OP bills (no admissionId)
    const opBills = bills.filter(b => !b.admissionId)
    const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n)

    return (
        <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">OP Bills</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Outpatient billing — {total} bills</p>
                </div>
                <Link href="/billing/op/new">
                    <Button className="gap-2"><Plus className="size-4" /> New OP Bill</Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        placeholder="Search patient name, UHID, bill#..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                    />
                </div>
                <Select value={status} onValueChange={v => { setStatus(v); setPage(1) }}>
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map(o => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="border border-border rounded-xl overflow-hidden bg-card">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            {["Bill #", "OP #", "Patient", "Doctor", "Visit Date", "Status", "Amount", ""].map(h => (
                                <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                                    <Loader2 className="animate-spin size-5 mx-auto" />
                                </td>
                            </tr>
                        ) : opBills.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                                    No OP bills found.
                                </td>
                            </tr>
                        ) : (
                            opBills.map(bill => {
                                const statusMeta = MappedBillStatusColors[bill.status]
                                const patientName = bill.patient
                                    ? `${bill.patient.firstName} ${bill.patient.lastName}`
                                    : "—"
                                const doctorName = (bill as any).opVisit?.doctor?.name || "—"
                                const visitDate = (bill as any).opVisit?.visitDate
                                    ? new Date((bill as any).opVisit.visitDate).toLocaleDateString("en-IN")
                                    : new Date(bill.createdAt).toLocaleDateString("en-IN")
                                const opNumber = (bill as any).opVisit?.opNumber || "—"

                                return (
                                    <tr
                                        key={bill.id}
                                        className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                                        onClick={() => router.push(`/billing/op/${bill.id}`)}
                                    >
                                        <td className="px-4 py-3 font-mono text-xs font-medium">{bill.billNumber}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{opNumber}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{patientName}</p>
                                            <p className="text-xs text-muted-foreground">{bill.patient?.uhid}</p>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{doctorName}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{visitDate}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className={statusMeta?.className ?? ""}>
                                                {statusMeta?.label ?? bill.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 font-semibold">{fmt(Number(bill.netAmount))}</td>
                                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost" size="icon-sm"
                                                    title="View Bill"
                                                    onClick={() => router.push(`/billing/op/${bill.id}`)}
                                                >
                                                    <FileText className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="icon-sm"
                                                    title="Print Invoice"
                                                    onClick={() => router.push(`/billing/invoice/${bill.id}`)}
                                                >
                                                    <Printer className="size-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {total > 15 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
                        <span className="text-xs text-muted-foreground">Page {page} · {total} total</span>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                            <Button variant="ghost" size="sm" disabled={opBills.length < 15} onClick={() => setPage(p => p + 1)}>Next</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
