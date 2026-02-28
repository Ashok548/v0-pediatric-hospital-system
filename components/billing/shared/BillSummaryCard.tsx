"use client"

import { Card, CardContent } from "@/components/ui/card"
import { BillSummary } from "@/lib/types/billing"
import { cn } from "@/lib/utils"

export function BillSummaryCard({
    summary,
    compact = false
}: {
    summary: BillSummary
    compact?: boolean
}) {
    const fmt = (n: number) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Math.abs(n))

    const isRefundOwed = summary.balanceDue < 0

    return (
        <Card className="bg-muted/30">
            <CardContent className={cn("space-y-2.5", compact ? "p-3" : "p-4")}>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{fmt(summary.subtotal)}</span>
                </div>
                {summary.totalDiscount > 0 && (
                    <div className="flex justify-between items-center text-sm text-green-600">
                        <span>Discount</span>
                        <span>−{fmt(summary.totalDiscount)}</span>
                    </div>
                )}
                {summary.totalTax > 0 && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="font-medium">+{fmt(summary.totalTax)}</span>
                    </div>
                )}
                <div className="border-t pt-2.5 flex justify-between items-center font-bold">
                    <span>Net Total</span>
                    <span className="text-lg">{fmt(summary.netTotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Paid Amount</span>
                    <span className="font-medium text-green-600">{fmt(summary.totalPaid)}</span>
                </div>
                {/* #9: Show refund row when applicable */}
                {summary.totalRefunded > 0 && (
                    <div className="flex justify-between items-center text-sm text-orange-600">
                        <span>Refunded</span>
                        <span className="font-medium">{fmt(summary.totalRefunded)}</span>
                    </div>
                )}
                <div className={cn(
                    "border-t pt-2.5 flex justify-between items-center font-bold",
                    isRefundOwed ? "text-orange-600" : "text-red-600"
                )}>
                    <span>{isRefundOwed ? "Refund Due" : "Balance Due"}</span>
                    <span className="text-lg">{fmt(summary.balanceDue)}</span>
                </div>
            </CardContent>
        </Card>
    )
}
