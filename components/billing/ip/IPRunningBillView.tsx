"use client"

import { useState } from "react"
import { useBillingStore } from "@/lib/store/billing-store"
import { BillSummaryCard } from "../shared/BillSummaryCard"
import { AddChargeModal } from "./AddChargeModal"
import { AdvancePaymentModal } from "./AdvancePaymentModal"
import { PaymentHistoryTable } from "./PaymentHistoryTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BillWorkflowStatus, BillItem, BillPayment, PatientBill, computeLineTotal } from "@/lib/types/billing"
import { User, Calendar, Bed, Activity, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function IPRunningBillView({ id }: { id: string }) {
    const router = useRouter()
    const { bills, addChargeToIpBill, addAdvanceToIpBill, initiateSettlement } = useBillingStore()

    // Find bill by admission ID (mock mapping assumes URL id matches admissionId or bill id)
    const bill = bills.find((b: PatientBill) => b.admissionId === id || b.id === id)

    if (!bill) {
        return (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-4">
                <p>No active billing record found for admission ID: {id}</p>
                <Button variant="outline" onClick={() => router.push('/billing')}>Back to Billing</Button>
            </div>
        )
    }

    const isClosed = bill.status === BillWorkflowStatus.Closed
    const isPendingSettlement = bill.status === BillWorkflowStatus.PendingSettlement

    const handleAddCharge = (item: BillItem) => {
        if (bill.admissionId) addChargeToIpBill(bill.admissionId, item)
    }

    const handleAddAdvance = (payment: BillPayment) => {
        if (bill.admissionId) addAdvanceToIpBill(bill.admissionId, payment)
    }

    const handleInitiateSettlement = () => {
        if (bill.admissionId) {
            initiateSettlement(bill.admissionId)
            router.push(`/billing/ip/${bill.admissionId}/settlement`)
        }
    }

    const formatAcc = (num: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(num)

    // Calculate length of stay naively
    const admissionDate = new Date(bill.date)
    const today = new Date()
    const lengthOfStay = Math.max(1, Math.ceil((today.getTime() - admissionDate.getTime()) / (1000 * 3600 * 24)))

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Main Content (Left) */}
            <div className="xl:col-span-2 space-y-6">

                {/* Header Details */}
                <Card className="bg-muted/10 border-blue-100">
                    <CardHeader className="py-4 border-b bg-white">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-bold">{bill.patientName}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">UHID: {bill.patientId} &middot; Admission: {bill.admissionId}</p>
                            </div>
                            <Badge variant={isClosed ? "default" : "secondary"} className={
                                isClosed ? "bg-green-600"
                                    : isPendingSettlement ? "bg-amber-500 text-white"
                                        : "bg-blue-600 text-white"
                            }>
                                {bill.status}
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
                            <span className="text-muted-foreground flex items-center gap-1.5"><Bed className="size-3.5" /> Bed Details</span>
                            <p className="font-medium">{bill.wardName ?? 'Ward'} / {bill.bedNumber ?? 'Bed'}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-muted-foreground flex items-center gap-1.5"><User className="size-3.5" /> Primary Doctor</span>
                            <p className="font-medium">{bill.doctorName ?? 'Not assigned'}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Running Charges Table */}
                <Card>
                    <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-semibold">Itemized Charges</CardTitle>
                        {!isClosed && !isPendingSettlement && (
                            <AddChargeModal onAddCharge={handleAddCharge} />
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        {bill.items.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground bg-muted/20 border-b border-dashed">
                                No charges added for this admission.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Service Name</th>
                                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Qty x Price</th>
                                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bill.items.map((item: BillItem) => (
                                            <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20">
                                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                                    {item.dateAdded ? new Date(item.dateAdded).toLocaleDateString() : "—"}
                                                </td>
                                                <td className="px-4 py-3 font-medium">{item.serviceName}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="font-normal">{item.category}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                                                    {item.quantity} &times; {formatAcc(item.unitPrice)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold">{formatAcc(computeLineTotal(item))}</td>
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
                        <CardTitle className="text-base font-semibold">Payment & Advances History</CardTitle>
                        {!isClosed && !isPendingSettlement && (
                            <AdvancePaymentModal onAddAdvance={handleAddAdvance} />
                        )}
                    </CardHeader>
                    <CardContent className="p-4">
                        <PaymentHistoryTable payments={bill.payments} />
                    </CardContent>
                </Card>

            </div>

            {/* Sidebar (Right) */}
            <div className="space-y-6">
                {/* Bill Summary */}
                <div className="sticky top-6 space-y-6">
                    <BillSummaryCard summary={bill.summary} />

                    {/* Main Action buttons */}
                    <div className="flex flex-col gap-3">
                        {!isClosed && !isPendingSettlement && (
                            <Button
                                onClick={handleInitiateSettlement}
                                className="w-full gap-2 h-12 text-lg"
                            >
                                Initiate Discharge & Settlement
                            </Button>
                        )}

                        {isPendingSettlement && (
                            <Button
                                onClick={() => router.push(`/billing/ip/${bill.admissionId}/settlement`)}
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
