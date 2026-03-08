"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BillSummaryCard } from "../shared/BillSummaryCard"
import { PaymentCollectionForm } from "../shared/PaymentCollectionForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PaymentMode, RecordPaymentDto, MappedBillStatusColors } from "@/lib/types/billing"
import { useBills, recordPayment, finalizeBill } from "@/lib/api/billing"
import { CheckCircle, AlertTriangle, FileText, ArrowLeft, RefreshCw, Loader2 } from "lucide-react"

export function FinalSettlementForm({ id }: { id: string }) {
    const router = useRouter()
    const { bills, isLoading, mutate } = useBills({ admissionId: id })
    const bill = bills?.[0]

    const [refundMode, setRefundMode] = useState<PaymentMode>('CASH')
    const [refundDialogOpen, setRefundDialogOpen] = useState(false)
    const [isActionLoading, setIsActionLoading] = useState(false)

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary size-8" /></div>
    }

    if (!bill) {
        return <div className="p-8 text-center text-muted-foreground">Bill not found for this admission.</div>
    }

    const isClosed = bill.status === 'PAID' || bill.status === 'FINAL'
    const balanceDue = Number(bill.dueAmount)
    const refundAmount = Math.abs(balanceDue)

    const handleFinalPaymentAndClose = async (payment: RecordPaymentDto) => {
        setIsActionLoading(true)
        try {
            await recordPayment(bill.id, payment)
            await finalizeBill(bill.id)
            await mutate()
            router.push(`/billing/invoice/${bill.id}`)
        } catch (err) {
            console.error(err)
        } finally {
            setIsActionLoading(false)
        }
    }

    const handleLockFullyPaid = async () => {
        setIsActionLoading(true)
        try {
            await finalizeBill(bill.id)
            await mutate()
            router.push(`/billing/invoice/${bill.id}`)
        } catch (err) {
            console.error(err)
        } finally {
            setIsActionLoading(false)
        }
    }

    // Since Refund API support is deferred, we just finalize the bill here
    const handleRefund = async () => {
        setIsActionLoading(true)
        try {
            await finalizeBill(bill.id)
            await mutate()
            setRefundDialogOpen(false)
            router.push(`/billing/invoice/${bill.id}`)
        } catch (err) {
            console.error(err)
        } finally {
            setIsActionLoading(false)
        }
    }

    const formatAcc = (n: number | string) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Math.abs(Number(n)))

    const pName = bill.patient ? `${bill.patient.firstName} ${bill.patient.lastName}` : "Unknown Patient"
    const statusObj = MappedBillStatusColors[bill.status] || { label: bill.status, className: "bg-muted" }

    return (
        <div className="max-w-4xl mx-auto space-y-6 relative">

            {isActionLoading && (
                <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                    <div className="bg-card p-4 rounded-lg shadow-lg flex items-center gap-3 border">
                        <Loader2 className="size-5 animate-spin text-primary" />
                        <span className="font-medium">Processing...</span>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="size-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Final Settlement</h2>
                    <p className="text-sm text-muted-foreground">
                        Admission: {bill.admissionId || "N/A"} &middot; Patient: {pName}
                        {bill.billNumber && (
                            <> &middot; Invoice: <span className="font-mono">{bill.billNumber}</span></>
                        )}
                    </p>
                </div>
                <Badge className={statusObj.className + " ml-auto"} variant="outline">
                    {statusObj.label}
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Left: Summary */}
                <Card>
                    <CardHeader className="py-4 border-b">
                        <CardTitle className="text-base font-semibold">Settlement Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <BillSummaryCard bill={bill} />
                    </CardContent>
                </Card>

                {/* Right: Action panel depending on state */}
                <div className="space-y-4">

                    {!isClosed && balanceDue > 0 && (
                        <PaymentCollectionForm
                            balanceDue={balanceDue}
                            onPaymentAdd={handleFinalPaymentAndClose}
                            isSubmitting={isActionLoading}
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
                                    disabled={isActionLoading}
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

            {/* Refund Dialog */}
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
                                    <SelectItem value="CASH">Cash</SelectItem>
                                    <SelectItem value="UPI">UPI</SelectItem>
                                    <SelectItem value="ONLINE">Bank Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Note: Backend API support for refunds is deferred. This will lock the bill.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleRefund} disabled={isActionLoading} className="bg-orange-600 hover:bg-orange-700">
                            {isActionLoading ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
                            Confirm Refund & Lock
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
