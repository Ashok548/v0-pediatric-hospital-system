"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ApiBill } from "@/lib/types/billing"
import { cn } from "@/lib/utils"

export function BillSummaryCard({
    bill,
    compact = false
}: {
    bill: ApiBill
    compact?: boolean
}) {
    const fmt = (n: number) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Math.abs(n))

    const balanceDue = Number(bill.dueAmount)
    const isRefundOwed = balanceDue < 0

    return (
        <Card className="bg-muted/30">
            <CardContent className={cn("space-y-2.5", compact ? "p-3" : "p-4")}>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{fmt(Number(bill.totalAmount))}</span>
                </div>
                {Number(bill.discountAmount) > 0 && (
                    <div className="flex justify-between items-center text-sm text-green-600">
                        <span>Discount</span>
                        <span>−{fmt(Number(bill.discountAmount))}</span>
                    </div>
                )}
                {Number(bill.taxAmount) > 0 && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="font-medium">+{fmt(Number(bill.taxAmount))}</span>
                    </div>
                )}
                <div className="border-t pt-2.5 flex justify-between items-center font-bold">
                    <span>Net Total</span>
                    <span className="text-lg">{fmt(Number(bill.netAmount))}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Paid Amount</span>
                    <span className="font-medium text-green-600">{fmt(Number(bill.paidAmount))}</span>
                </div>
                <div className={cn(
                    "border-t pt-2.5 flex justify-between items-center font-bold",
                    isRefundOwed ? "text-orange-600" : "text-red-600"
                )}>
                    <span>{isRefundOwed ? "Refund Due" : "Balance Due"}</span>
                    <span className="text-lg">{fmt(balanceDue)}</span>
                </div>
            </CardContent>
        </Card>
    )
}
