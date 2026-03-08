"use client"

import { useState } from "react"
import { BillSummaryCard } from "../shared/BillSummaryCard"
import { AddChargeModal } from "./AddChargeModal"
import { AdvancePaymentModal } from "./AdvancePaymentModal"
import { PaymentHistoryTable } from "./PaymentHistoryTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Calendar, Bed, Activity, ArrowRight, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useBills, addBillItem, recordPayment } from "@/lib/api/billing"
import { AddBillItemDto, RecordPaymentDto, MappedBillStatusColors } from "@/lib/types/billing"

export function IPRunningBillView({ id }: { id: string }) {
    const router = useRouter()

    // We expect the 'id' to be the admissionId. In a real scenario we might have the bill ID instead,
    // but the original mockup assumed viewing by admissionId.
    const { bills, isLoading, error, mutate } = useBills({ admissionId: id })
    const bill = bills?.[0]

    const [isActionLoading, setIsActionLoading] = useState(false)
    const [actionError, setActionError] = useState<string | null>(null)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-600 flex flex-col items-center gap-4">
                <AlertTriangle className="size-8" />
                <p>Failed to load active billing record for this admission.</p>
                <Button variant="outline" onClick={() => mutate()}>Retry</Button>
            </div>
        )
    }

    if (!bill) {
        return (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-4">
                <p>No active billing record found for admission ID: {id}</p>
                <Button variant="outline" onClick={() => router.push('/billing')}>Back to Billing</Button>
            </div>
        )
    }

    const isClosed = bill.status === 'PAID' || bill.status === 'FINAL' || bill.status === 'PARTIALLY_PAID'
    const isPendingSettlement = bill.status === 'FINAL' && Number(bill.dueAmount) > 0 // Equivalent to pending settlement

    const handleAddCharge = async (item: AddBillItemDto) => {
        setActionError(null)
        setIsActionLoading(true)
        try {
            await addBillItem(bill.id, item)
            await mutate()
        } catch (err: any) {
            setActionError(err.message || "Failed to add charge")
        } finally {
            setIsActionLoading(false)
        }
    }

    const handleAddAdvance = async (payment: RecordPaymentDto) => {
        setActionError(null)
        setIsActionLoading(true)
        try {
            await recordPayment(bill.id, payment)
            await mutate()
        } catch (err: any) {
            setActionError(err.message || "Failed to add advance payment")
        } finally {
            setIsActionLoading(false)
        }
    }

    const formatAcc = (num: number | string) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(num) || 0)

    // Calculate length of stay naively
    const admissionDate = new Date(bill.createdAt)
    const today = new Date()
    const lengthOfStay = Math.max(1, Math.ceil((today.getTime() - admissionDate.getTime()) / (1000 * 3600 * 24)))

    const pName = bill.patient ? `${bill.patient.firstName} ${bill.patient.lastName}` : "Unknown Patient"
    const uhid = bill.patient?.uhid || "Unknown UHID"
    const dept = bill.admission?.department || "Inpatient"
    const doctor = (bill as any).doctorName || "Not assigned"

    const statusObj = MappedBillStatusColors[bill.status] || { label: bill.status, className: "bg-muted" }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 relative">

            {isActionLoading && (
                <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                    <div className="bg-card p-4 rounded-lg shadow-lg flex items-center gap-3 border">
                        <Loader2 className="size-5 animate-spin text-primary" />
                        <span className="font-medium">Processing...</span>
                    </div>
                </div>
            )}

            {/* Main Content (Left) */}
            <div className="xl:col-span-2 space-y-6">

                {actionError && (
                    <div className="flex items-center gap-3 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-800">
                        <AlertTriangle className="size-4 shrink-0" />
                        <p>{actionError}</p>
                    </div>
                )}

                {/* Header Details */}
                <Card className="bg-muted/10 border-blue-100">
                    <CardHeader className="py-4 border-b bg-white">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-bold">{pName}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">UHID: {uhid} &middot; Admission: {bill.admissionId || "N/A"}</p>
                            </div>
                            <Badge variant="outline" className={statusObj.className}>
                                {statusObj.label}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-white">
                        <div className="space-y-1">
                            <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="size-3.5" /> Admitted On</span>
                            <p className="font-medium">{admissionDate.toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-muted-foreground flex items-center gap-1.5"><Activity className="size-3.5" /> Length of Stay</span>
                            <p className="font-medium">{lengthOfStay} Days</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-muted-foreground flex items-center gap-1.5"><Bed className="size-3.5" /> Department</span>
                            <p className="font-medium">{dept}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-muted-foreground flex items-center gap-1.5"><User className="size-3.5" /> Primary Doctor</span>
                            <p className="font-medium">{doctor}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Running Charges Table */}
                <Card>
                    <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-semibold">Itemized Charges</CardTitle>
                        {!isClosed && !isPendingSettlement && (
                            <AddChargeModal onAddCharge={handleAddCharge} isSubmitting={isActionLoading} />
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        {(bill.items || []).length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground bg-muted/20 border-b border-dashed">
                                No charges added for this bill.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Service Name</th>
                                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Code</th>
                                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Qty x Price</th>
                                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bill.items!.map((item) => (
                                            <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20">
                                                <td className="px-4 py-3 font-medium">
                                                    {item.serviceName}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="font-mono text-[10px]">{item.serviceCode || 'GEN'}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                                                    {item.quantity} &times; {formatAcc(item.unitPrice)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold">{formatAcc(item.totalPrice)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payment History */}
                <Card>
                    <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-semibold">Payment History</CardTitle>
                        {!isClosed && !isPendingSettlement && (
                            <AdvancePaymentModal onAddAdvance={handleAddAdvance} isSubmitting={isActionLoading} />
                        )}
                    </CardHeader>
                    <CardContent className="p-4">
                        <PaymentHistoryTable payments={bill.payments || []} />
                    </CardContent>
                </Card>

            </div>

            {/* Sidebar (Right) */}
            <div className="space-y-6">
                {/* Bill Summary */}
                <div className="sticky top-6 space-y-6">
                    <BillSummaryCard bill={bill} />

                    {/* Main Action buttons */}
                    <div className="flex flex-col gap-3">
                        {!isClosed && !isPendingSettlement && (
                            <Button
                                onClick={() => router.push(`/billing/ip/${bill.id}/settlement`)}
                                className="w-full gap-2 h-12 text-lg"
                                disabled={Number(bill.totalAmount) === 0}
                            >
                                Initiate Discharge & Settlement
                            </Button>
                        )}

                        {isPendingSettlement && (
                            <Button
                                onClick={() => router.push(`/billing/ip/${bill.id}/settlement`)}
                                className="w-full gap-2 h-12 text-lg bg-orange-600 hover:bg-orange-700"
                            >
                                Proceed to Final Settlement
                            </Button>
                        )}

                        {isClosed && (
                            <Button className="w-full gap-2" size="lg" variant="secondary" onClick={() => router.push(`/billing/invoice/${bill.id}`)}>
                                View Receipt <ArrowRight className="size-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

        </div>
    )
}
