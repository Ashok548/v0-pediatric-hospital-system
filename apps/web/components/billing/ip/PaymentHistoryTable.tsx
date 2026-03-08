"use client"

import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ApiPayment } from "@/lib/types/billing"
import { cn } from "@/lib/utils"

export function PaymentHistoryTable({ payments }: { payments: ApiPayment[] }) {
    if (!payments || payments.length === 0) {
        return (
            <div className="py-8 text-center text-sm text-muted-foreground bg-muted/20 border border-dashed rounded-md">
                No payment history available.
            </div>
        )
    }

    const fmt = (n: number | string) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Math.abs(Number(n)))

    return (
        <div className="border rounded-md overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Receipt / Ref</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments.map(p => {
                        const isRefund = p.amount < 0
                        const derivedStatus = isRefund ? 'REFUNDED' : 'SUCCESS'

                        return (
                            <TableRow
                                key={p.id}
                                className={cn(
                                    "hover:bg-muted/20",
                                    isRefund ? "bg-orange-50/60 hover:bg-orange-50" : ""
                                )}
                            >
                                <TableCell className="font-medium whitespace-nowrap">
                                    {new Date(p.paymentDate).toLocaleString('en-IN', {
                                        day: "2-digit", month: "short", year: "numeric",
                                        hour: "2-digit", minute: "2-digit"
                                    })}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{p.transactionRef || "—"}</TableCell>
                                <TableCell>{p.paymentMode}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn(
                                        isRefund ? "bg-orange-100 text-orange-700 border-orange-200" : ""
                                    )}>
                                        {derivedStatus}
                                    </Badge>
                                </TableCell>
                                <TableCell className={cn(
                                    "text-right font-semibold",
                                    isRefund ? "text-orange-600" : "text-green-600"
                                )}>
                                    {isRefund ? `−${fmt(p.amount)}` : fmt(p.amount)}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
