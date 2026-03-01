"use client"

// ─── #8: Refund rows styled distinctly ────────────────────────────────────────
// Advance → blue badge, Payment → neutral badge, Refund → orange row + badge

import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BillPayment, PaymentStatus } from "@/lib/types/billing"
import { cn } from "@/lib/utils"
import { RefreshCw } from "lucide-react"

export function PaymentHistoryTable({ payments }: { payments: BillPayment[] }) {
    if (payments.length === 0) {
        return (
            <div className="py-8 text-center text-sm text-muted-foreground bg-muted/20 border border-dashed rounded-md">
                No payment history available.
            </div>
        )
    }

    const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Math.abs(n))

    return (
        <div className="border rounded-md overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Receipt No</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments.map(p => {
                        const isRefund = p.status === PaymentStatus.Refunded
                        const isAdvance = p.isAdvance === true

                        return (
                            <TableRow
                                key={p.id}
                                className={cn(
                                    "hover:bg-muted/20",
                                    isRefund && "bg-orange-50/60 hover:bg-orange-50"
                                )}
                            >
                                <TableCell className="font-medium whitespace-nowrap">
                                    {new Date(p.date).toLocaleString('en-IN', {
                                        day: "2-digit", month: "short", year: "numeric",
                                        hour: "2-digit", minute: "2-digit"
                                    })}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{p.receiptNo || "—"}</TableCell>
                                <TableCell>{p.mode}</TableCell>
                                <TableCell>
                                    {isRefund ? (
                                        <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 gap-1">
                                            <RefreshCw className="size-3" /> Refund
                                        </Badge>
                                    ) : isAdvance ? (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Advance</Badge>
                                    ) : (
                                        <Badge variant="outline">Payment</Badge>
                                    )}
                                </TableCell>
                                <TableCell className={cn(
                                    "text-right font-semibold",
                                    isRefund ? "text-orange-600" : "text-green-600"
                                )}>
                                    {isRefund ? `−${fmt(p.amount)}` : fmt(p.amount)}
                                    {p.note && (
                                        <p className="text-[10px] font-normal text-muted-foreground mt-0.5">{p.note}</p>
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
