"use client"

// ─── Improvements #9, #11 ─────────────────────────────────────────────────────
// #9: Refund is properly written to payment history via addRefund store action
// #11: lineTotal removed from table — uses computeLineTotal at render time

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useBillingStore } from "@/lib/store/billing-store"
import { BillSummaryCard } from "../shared/BillSummaryCard"
import { PaymentCollectionForm } from "../shared/PaymentCollectionForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    BillWorkflowStatus, BillPayment, PatientBill,
    PaymentStatus, PaymentMode, computeLineTotal
} from "@/lib/types/billing"
import { CheckCircle, AlertTriangle, FileText, ArrowLeft, RefreshCw } from "lucide-react"

export function FinalSettlementForm({ id }: { id: string }) {
    const router = useRouter()
    const { bills, settleIpBill, addRefund } = useBillingStore()

    const [refundMode, setRefundMode] = useState<PaymentMode>('Cash')
    const [refundDialogOpen, setRefundDialogOpen] = useState(false)

    const bill = bills.find((b: PatientBill) => b.admissionId === id || b.id === id)

    if (!bill) {
        return <div className="p-8 text-center text-muted-foreground">Bill not found.</div>
    }

    const isClosed = bill.status === BillWorkflowStatus.Closed
    const balanceDue = bill.summary.balanceDue   // negative = refund owed
    const refundAmount = Math.abs(balanceDue)

    const handleFinalPaymentAndClose = (payment: BillPayment) => {
        settleIpBill(bill.admissionId!, payment)
        router.push(`/billing/invoice/${bill.id}`)
    }

    const handleLockFullyPaid = () => {
        settleIpBill(bill.admissionId!)
        router.push(`/billing/invoice/${bill.id}`)
    }

    // #9: Refund action — writes payment entry then closes
    const handleRefund = () => {
        addRefund(bill.id, refundAmount, refundMode, 'Excess advance refund')
        settleIpBill(bill.admissionId!)
        setRefundDialogOpen(false)
        router.push(`/billing/invoice/${bill.id}`)
    }

    const formatAcc = (n: number) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Math.abs(n))

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="size-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Final Settlement</h2>
                    <p className="text-sm text-muted-foreground">
                        Admission: {bill.admissionId} &middot; Patient: {bill.patientName}
                        {bill.invoiceNumber && (
                            <> &middot; Invoice: <span className="font-mono">{bill.invoiceNumber}</span></>
                        )}
                    </p>
                </div>
                <Badge className="ml-auto" variant="outline">
                    {bill.status}
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Left: Summary */}
                <Card>
                    <CardHeader className="py-4 border-b">
                        <CardTitle className="text-base font-semibold">Settlement Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <BillSummaryCard summary={bill.summary} />
                    </CardContent>
                </Card>

                {/* Right: Action panel depending on state */}
                <div className="space-y-4">

                    {!isClosed && balanceDue > 0 && (
                        <PaymentCollectionForm
                            balanceDue={balanceDue}
                            onPaymentAdd={handleFinalPaymentAndClose}
                        />
                    )}

                    {!isClosed && balanceDue < 0 && (
                        <Card className="border-orange-200 bg-orange-50/50">
                            <CardHeader className="py-4 border-b border-orange-100">
                                <CardTitle className="text-base font-semibold text-orange-800 flex items-center gap-2">
                                    <AlertTriangle className="size-4" /> Refund Due
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <p className="text-sm text-orange-700">
                                    Patient has an excess advance of <strong>{formatAcc(refundAmount)}</strong>.
                                    A refund must be issued before closing this bill.
                                </p>
                                <Button
                                    className="w-full bg-orange-600 hover:bg-orange-700 gap-2"
                                    onClick={() => setRefundDialogOpen(true)}
                                >
                                    <RefreshCw className="size-4" /> Issue Refund & Lock Bill
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {!isClosed && balanceDue === 0 && (
                        <Card className="border-green-200 bg-green-50/50">
                            <CardContent className="p-6 text-center space-y-4">
                                <div className="mx-auto size-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="size-6 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-green-800">Balance Cleared</h3>
                                    <p className="text-sm text-green-700 mt-1">All dues settled. Lock the bill to generate the final invoice.</p>
                                </div>
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    size="lg"
                                    onClick={handleLockFullyPaid}
                                >
                                    Lock Bill & Generate Invoice
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {isClosed && (
                        <Card>
                            <CardContent className="p-6 text-center space-y-4">
                                <div className="mx-auto size-12 bg-muted rounded-full flex items-center justify-center">
                                    <CheckCircle className="size-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground">This bill is fully settled and locked.</p>
                                <Button className="w-full" size="lg" variant="outline"
                                    onClick={() => router.push(`/billing/invoice/${bill.id}`)}>
                                    <FileText className="size-4 mr-2" /> View Invoice
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* #9: Refund Dialog */}
            <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Process Refund</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex justify-between items-center p-3 bg-orange-50 rounded-md border border-orange-200 text-sm">
                            <span className="text-orange-800 font-medium">Refund Amount</span>
                            <span className="font-bold text-orange-900">{formatAcc(refundAmount)}</span>
                        </div>
                        <div className="grid gap-2">
                            <Label>Refund Mode</Label>
                            <Select value={refundMode} onValueChange={(v) => setRefundMode(v as PaymentMode)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                    <SelectItem value="UPI">UPI</SelectItem>
                                    <SelectItem value="Online">Bank Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            A refund entry will be recorded in the payment history and the bill will be permanently locked.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleRefund} className="bg-orange-600 hover:bg-orange-700">
                            Confirm Refund
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
