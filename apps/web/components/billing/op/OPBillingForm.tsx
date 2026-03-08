"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PatientVisitSelector, SelectedVisit } from "./PatientVisitSelector"
import { PatientBillInfo } from "./PatientBillInfo"
import { AddBillItemLine } from "./AddBillItemLine"
import { BillSummaryCard } from "../shared/BillSummaryCard"
import { PaymentCollectionForm } from "../shared/PaymentCollectionForm"
import {
    Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AddBillItemDto, RecordPaymentDto, MappedBillStatusColors } from "@/lib/types/billing"
import { useBill, createBill, addBillItem, removeBillItem, recordPayment, cancelBill, finalizeBill } from "@/lib/api/billing"
import { apiClient } from "@/lib/api-client"
import { Trash2, FileText, CheckCircle, Save, XCircle, AlertTriangle, Loader2 } from "lucide-react"

export function OPBillingForm() {
    const router = useRouter()
    const [activeBillId, setActiveBillId] = useState<string | null>(null)

    // API Hook
    const { bill, isLoading, mutate } = useBill(activeBillId)

    // UI States
    const [confirmFinalize, setConfirmFinalize] = useState(false)
    const [confirmVoid, setConfirmVoid] = useState(false)
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
    const [paymentError, setPaymentError] = useState<string | null>(null)
    const [isCreatingBill, setIsCreatingBill] = useState(false)
    const [isActionLoading, setIsActionLoading] = useState(false)

    const isClosed = bill?.status === 'PAID' || bill?.status === 'FINAL' || bill?.status === 'PARTIALLY_PAID'
    const isVoided = bill?.status === 'CANCELLED'

    // ─── Step 1: Patient selector ────────────────────────────────────────
    const handleVisitSelect = async (visit: SelectedVisit) => {
        setDuplicateWarning(null)
        setIsCreatingBill(true)
        try {
            // Find patient by UHID
            const res = await apiClient<{ data: any[] }>(`/patients?search=${visit.uhid}`)
            const patient = res.data?.[0]

            if (!patient) {
                setDuplicateWarning(`Patient with UHID ${visit.uhid} not found in database. Create patient first.`)
                setIsCreatingBill(false)
                return
            }

            // Create new OP bill for patient
            const newBill = await createBill({
                patientId: patient.id,
                notes: `OP Consultation: ${visit.department} (${visit.doctor})`
            })
            setActiveBillId(newBill.id)
        } catch (err: any) {
            console.error("Failed to create bill", err)
            setDuplicateWarning(err.message || "Failed to create new bill. Please try again.")
        } finally {
            setIsCreatingBill(false)
        }
    }

    // ─── Step 2: Mutations ─────────────────────────────────────────────
    const handleAddItem = async (item: AddBillItemDto) => {
        if (!activeBillId) return
        setIsActionLoading(true)
        try {
            await addBillItem(activeBillId, item)
            await mutate()
        } catch (err) {
            console.error(err)
        } finally {
            setIsActionLoading(false)
        }
    }

    const handleRemoveItem = async (itemId: string) => {
        if (!activeBillId) return
        setIsActionLoading(true)
        try {
            await removeBillItem(activeBillId, itemId)
            await mutate()
        } catch (err) {
            console.error(err)
        } finally {
            setIsActionLoading(false)
        }
    }

    const handlePayment = async (p: RecordPaymentDto) => {
        if (!activeBillId) return
        setPaymentError(null)
        setIsActionLoading(true)
        try {
            await recordPayment(activeBillId, p)
            await mutate()
        } catch (err: any) {
            setPaymentError(err.message || 'Payment processing failed')
        } finally {
            setIsActionLoading(false)
        }
    }

    const handleFinalize = async () => {
        if (!activeBillId) return
        setIsActionLoading(true)
        try {
            await finalizeBill(activeBillId)
            await mutate()
            setConfirmFinalize(false)
        } catch (err) {
            console.error(err)
        } finally {
            setIsActionLoading(false)
        }
    }

    const handleVoid = async () => {
        if (!activeBillId) return
        setIsActionLoading(true)
        try {
            await cancelBill(activeBillId)
            await mutate()
            setConfirmVoid(false)
        } catch (err) {
            console.error(err)
        } finally {
            setIsActionLoading(false)
        }
    }

    const formatAcc = (n: number | string) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(n) || 0)

    // ─── Step 1: Render Visit Selector ───────────────────────────────────
    if (!activeBillId || (!bill && !isLoading)) {
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">New Outpatient Bill</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Select today&apos;s patient visit to begin billing.
                    </p>
                </div>
                {duplicateWarning && (
                    <div className="flex items-center gap-3 p-3 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-800">
                        <AlertTriangle className="size-4 shrink-0" />
                        <p>{duplicateWarning}</p>
                    </div>
                )}
                {isCreatingBill ? (
                    <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                        <Loader2 className="size-8 animate-spin mb-4" />
                        <p>Creating Bill...</p>
                    </div>
                ) : (
                    <PatientVisitSelector onSelect={handleVisitSelect} />
                )}
            </div>
        )
    }

    if (isLoading || !bill) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    const statusObj = MappedBillStatusColors[bill.status] || { label: bill.status, className: "bg-muted" }

    // ─── Step 2: Full billing form ───────────────────────────────────────
    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
                {isActionLoading && (
                    <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                        <div className="bg-card p-4 rounded-lg shadow-lg flex items-center gap-3 border">
                            <Loader2 className="size-5 animate-spin text-primary" />
                            <span className="font-medium">Processing...</span>
                        </div>
                    </div>
                )}

                <div className="lg:col-span-2 space-y-6">

                    {/* Header */}
                    <div className="flex items-center gap-4 justify-between">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Outpatient Billing</h2>
                            <p className="text-sm text-muted-foreground">
                                Invoice: <span className="font-mono">{bill.billNumber}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className={statusObj.className}>
                                {statusObj.label}
                            </Badge>
                            {bill.status === 'DRAFT' && (
                                <Button
                                    variant="outline" size="sm"
                                    className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => setConfirmVoid(true)}
                                >
                                    <XCircle className="size-4" /> Void
                                </Button>
                            )}
                        </div>
                    </div>

                    <PatientBillInfo bill={bill} isReadOnly={isClosed || isVoided} />

                    {/* Items card */}
                    {!isVoided && (
                        <Card>
                            <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
                                <CardTitle className="text-base font-semibold">Bill Items</CardTitle>
                                <Badge variant="outline">{(bill.items || []).length} Item(s)</Badge>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                {(bill.items || []).length > 0 ? (
                                    <div className="border rounded-md overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50 border-b">
                                                <tr>
                                                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Service</th>
                                                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Qty</th>
                                                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Rate</th>
                                                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Disc</th>
                                                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Tax</th>
                                                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Total</th>
                                                    {!isClosed && <th className="px-3 py-2" />}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bill.items!.map((item) => (
                                                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20">
                                                        <td className="px-3 py-2.5">
                                                            <p className="font-medium">{item.serviceName}</p>
                                                            <p className="text-[11px] text-muted-foreground">{item.serviceCode || 'General'}</p>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">{item.quantity}</td>
                                                        <td className="px-3 py-2.5 text-right">{formatAcc(item.unitPrice)}</td>
                                                        <td className="px-3 py-2.5 text-right">{Number(item.discountPercent)}%</td>
                                                        <td className="px-3 py-2.5 text-right">{Number(item.taxPercent)}%</td>
                                                        <td className="px-3 py-2.5 text-right font-semibold">
                                                            {formatAcc(item.totalPrice)}
                                                        </td>
                                                        {!isClosed && (
                                                            <td className="px-3 py-2.5 text-right">
                                                                <Button
                                                                    variant="ghost" size="icon"
                                                                    className="size-7 text-muted-foreground hover:text-red-600"
                                                                    onClick={() => handleRemoveItem(item.id)}
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </Button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-sm text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                                        No items. Use the form below to add services.
                                    </div>
                                )}

                                {!isClosed && (
                                    <>
                                        <Separator className="my-2" />
                                        <p className="text-sm font-semibold">Add Item</p>
                                        <AddBillItemLine onAdd={handleAddItem} />
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {isVoided && (
                        <Card className="border-red-200 bg-red-50/50">
                            <CardContent className="p-6 text-center">
                                <XCircle className="size-10 text-red-400 mx-auto mb-3" />
                                <h3 className="font-semibold text-red-800">Bill Cancelled</h3>
                                <p className="text-sm text-red-600 mt-1">
                                    This bill was cancelled and is now read-only.
                                </p>
                                <Button variant="outline" className="mt-4" onClick={() => setActiveBillId(null)}>
                                    Start New Bill
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <BillSummaryCard bill={bill} />

                    {paymentError && (
                        <div className="flex items-center gap-2 p-3 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md">
                            <AlertTriangle className="size-4 shrink-0" />
                            {paymentError}
                        </div>
                    )}

                    {!isClosed && !isVoided && Number(bill.dueAmount) > 0 && Number(bill.totalAmount) > 0 && (
                        <PaymentCollectionForm
                            balanceDue={Number(bill.dueAmount)}
                            onPaymentAdd={handlePayment}
                        />
                    )}

                    <div className="flex flex-col gap-3">
                        {!isClosed && !isVoided && (
                            <>
                                <Button
                                    size="lg" className="w-full gap-2"
                                    disabled={Number(bill.dueAmount) > 0 || (bill.items || []).length === 0}
                                    onClick={() => setConfirmFinalize(true)}
                                >
                                    <CheckCircle className="size-4" /> Finalize & Generate Invoice
                                </Button>
                                <Button variant="outline" className="w-full gap-2"
                                    onClick={() => router.push('/billing')}
                                >
                                    <Save className="size-4" /> Save as Draft & Exit
                                </Button>
                            </>
                        )}
                        {isClosed && (
                            <Button size="lg" variant="secondary" className="w-full gap-2"
                                onClick={() => router.push(`/billing/invoice/${bill.id}`)}>
                                <FileText className="size-4" /> View / Print Receipt
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirm Finalize */}
            <AlertDialog open={confirmFinalize} onOpenChange={setConfirmFinalize}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Finalize & Lock Bill?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently lock the bill and generate an invoice.
                            No further changes can be made after this action.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleFinalize}>
                            Yes, Finalize
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Confirm Void */}
            <AlertDialog open={confirmVoid} onOpenChange={setConfirmVoid}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel This Bill?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will cancel the bill permanently. It cannot be reopened.
                            Are you sure you want to proceed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Bill</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={handleVoid}
                        >
                            Yes, Cancel Bill
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
