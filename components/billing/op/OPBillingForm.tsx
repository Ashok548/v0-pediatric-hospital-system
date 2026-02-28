"use client"

// ─── Round 2 Improvements ────────────────────────────────────────────────────
// #1:  Duplicate OP guard — if createOpBill returns null, show toast
// #4:  Edit history tracked via changes param
// #5:  Payment validation feedback (error toasts)
// #6:  Discount reason + approvedBy in edit dialog
// #13: Confirmation dialog before Finalize, Void

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useBillingStore } from "@/lib/store/billing-store"
import { PatientVisitSelector, SelectedVisit } from "./PatientVisitSelector"
import { PatientBillInfo } from "./PatientBillInfo"
import { AddBillItemLine } from "./AddBillItemLine"
import { BillSummaryCard } from "../shared/BillSummaryCard"
import { PaymentCollectionForm } from "../shared/PaymentCollectionForm"
import {
    Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BillWorkflowStatus, BillItem, BillPayment, PatientBill, computeLineTotal } from "@/lib/types/billing"
import { Trash2, FileText, CheckCircle, Save, XCircle, Pencil, AlertTriangle } from "lucide-react"

export function OPBillingForm() {
    const router = useRouter()
    const { bills, createOpBill, addItemToBill, removeItemFromBill,
        updateItemInBill, addPaymentToBill, voidBill, closeBill } = useBillingStore()

    const [activeBillId, setActiveBillId] = useState<string | null>(null)
    const [editingItem, setEditingItem] = useState<BillItem | null>(null)
    const [originalItem, setOriginalItem] = useState<BillItem | null>(null)
    // #13: Confirmation states
    const [confirmFinalize, setConfirmFinalize] = useState(false)
    const [confirmVoid, setConfirmVoid] = useState(false)
    // #1: Duplicate guard feedback
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
    // #5: Payment error feedback
    const [paymentError, setPaymentError] = useState<string | null>(null)

    const bill = bills.find((b: PatientBill) => b.id === activeBillId)
    const isClosed = bill?.status === BillWorkflowStatus.Closed
    const isVoided = bill?.status === BillWorkflowStatus.Voided

    // #1: Duplicate guard on visit select
    const handleVisitSelect = (visit: SelectedVisit) => {
        setDuplicateWarning(null)
        const result = createOpBill(
            visit.uhid,
            visit.patientName,
            visit.visitId,
            visit.doctor,
            visit.department
        )
        if (result === null) {
            setDuplicateWarning(`A bill already exists for visit ${visit.visitId}. Please search existing bills.`)
            return
        }
        setActiveBillId(result)
    }

    // #5: Payment with validation
    const handlePayment = (p: BillPayment) => {
        if (!bill) return
        setPaymentError(null)
        const result = addPaymentToBill(bill.id, p)
        if (!result.success) {
            setPaymentError(result.error ?? 'Payment failed')
        }
    }

    const formatAcc = (n: number) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n)

    // ─── Step 1: Patient selector ────────────────────────────────────────
    if (!activeBillId || !bill) {
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
                <PatientVisitSelector onSelect={handleVisitSelect} />
            </div>
        )
    }

    // ─── Step 2: Full billing form ───────────────────────────────────────
    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">

                    {/* Header */}
                    <div className="flex items-center gap-4 justify-between">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Outpatient Billing</h2>
                            <p className="text-sm text-muted-foreground">
                                Invoice: <span className="font-mono">{bill.invoiceNumber}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className={
                                isClosed ? "bg-green-50 text-green-700 border-green-200" :
                                    isVoided ? "bg-red-50 text-red-700 border-red-200" :
                                        "bg-amber-50 text-amber-700 border-amber-200"
                            }>
                                {bill.status}
                            </Badge>
                            {bill.status === BillWorkflowStatus.Draft && (
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
                                <Badge variant="outline">{bill.items.length} Item(s)</Badge>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                {bill.items.length > 0 ? (
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
                                                {bill.items.map((item: BillItem) => (
                                                    <tr key={item.id} className="border-b last:border-0 group hover:bg-muted/20">
                                                        <td className="px-3 py-2.5">
                                                            <p className="font-medium">{item.serviceName}</p>
                                                            <p className="text-[11px] text-muted-foreground">{item.category}</p>
                                                            {item.discountReason && (
                                                                <p className="text-[10px] text-amber-600 mt-0.5">
                                                                    Disc: {item.discountReason}
                                                                    {item.discountApprovedBy && ` (Auth: ${item.discountApprovedBy})`}
                                                                </p>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">{item.quantity}</td>
                                                        <td className="px-3 py-2.5 text-right">{formatAcc(item.unitPrice)}</td>
                                                        <td className="px-3 py-2.5 text-right">{item.discountPercent}%</td>
                                                        <td className="px-3 py-2.5 text-right">{item.taxPercent}%</td>
                                                        <td className="px-3 py-2.5 text-right font-semibold">
                                                            {formatAcc(computeLineTotal(item))}
                                                        </td>
                                                        {!isClosed && (
                                                            <td className="px-3 py-2.5 text-right">
                                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Button
                                                                        variant="ghost" size="icon"
                                                                        className="size-7 text-muted-foreground hover:text-blue-600"
                                                                        onClick={() => {
                                                                            setOriginalItem({ ...item })
                                                                            setEditingItem({ ...item })
                                                                        }}
                                                                    >
                                                                        <Pencil className="size-3.5" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost" size="icon"
                                                                        className="size-7 text-muted-foreground hover:text-red-600"
                                                                        onClick={() => removeItemFromBill(bill.id, item.id)}
                                                                    >
                                                                        <Trash2 className="size-3.5" />
                                                                    </Button>
                                                                </div>
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
                                        <AddBillItemLine onAdd={item => addItemToBill(bill.id, item)} />
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {isVoided && (
                        <Card className="border-red-200 bg-red-50/50">
                            <CardContent className="p-6 text-center">
                                <XCircle className="size-10 text-red-400 mx-auto mb-3" />
                                <h3 className="font-semibold text-red-800">Bill Voided</h3>
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
                    <BillSummaryCard summary={bill.summary} />

                    {/* #5: Show payment error */}
                    {paymentError && (
                        <div className="flex items-center gap-2 p-3 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md">
                            <AlertTriangle className="size-4 shrink-0" />
                            {paymentError}
                        </div>
                    )}

                    {!isClosed && !isVoided && bill.summary.balanceDue > 0 && bill.items.length > 0 && (
                        <PaymentCollectionForm
                            balanceDue={bill.summary.balanceDue}
                            onPaymentAdd={handlePayment}
                        />
                    )}

                    <div className="flex flex-col gap-3">
                        {!isClosed && !isVoided && (
                            <>
                                <Button
                                    size="lg" className="w-full gap-2"
                                    disabled={bill.summary.balanceDue > 0 || bill.items.length === 0}
                                    onClick={() => setConfirmFinalize(true)}
                                >
                                    <CheckCircle className="size-4" /> Finalize & Generate Invoice
                                </Button>
                                <Button variant="outline" className="w-full gap-2">
                                    <Save className="size-4" /> Save as Draft
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

            {/* #4/#6: Edit Item Dialog with discount reason */}
            {editingItem && (
                <Dialog open onOpenChange={() => { setEditingItem(null); setOriginalItem(null) }}>
                    <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Edit Line Item</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-3 py-2">
                            <div className="grid gap-1.5">
                                <Label>Service</Label>
                                <Input readOnly value={editingItem.serviceName} className="bg-muted" />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="grid gap-1.5">
                                    <Label>Qty</Label>
                                    <Input type="number" min={1} value={editingItem.quantity}
                                        onChange={e => setEditingItem(prev => prev ? { ...prev, quantity: Math.max(1, Number(e.target.value)) } : null)} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>Disc %</Label>
                                    <Input type="number" min={0} max={100} value={editingItem.discountPercent}
                                        onChange={e => setEditingItem(prev => prev ? { ...prev, discountPercent: Math.min(100, Math.max(0, Number(e.target.value))) } : null)} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label>Tax %</Label>
                                    <Input type="number" min={0} max={28} value={editingItem.taxPercent}
                                        onChange={e => setEditingItem(prev => prev ? { ...prev, taxPercent: Math.min(28, Math.max(0, Number(e.target.value))) } : null)} />
                                </div>
                            </div>
                            {/* #6: Discount reason (shown when discount > 0) */}
                            {editingItem.discountPercent > 0 && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-1.5">
                                        <Label>Discount Reason</Label>
                                        <Input placeholder="e.g. Staff discount"
                                            value={editingItem.discountReason ?? ''}
                                            onChange={e => setEditingItem(prev => prev ? { ...prev, discountReason: e.target.value } : null)} />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label>Approved By</Label>
                                        <Input placeholder="e.g. Dr. Kumar"
                                            value={editingItem.discountApprovedBy ?? ''}
                                            onChange={e => setEditingItem(prev => prev ? { ...prev, discountApprovedBy: e.target.value } : null)} />
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between text-sm font-semibold pt-1 border-t">
                                <span>Updated Total:</span>
                                <span>{formatAcc(computeLineTotal(editingItem))}</span>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setEditingItem(null); setOriginalItem(null) }}>Cancel</Button>
                            <Button onClick={() => {
                                if (editingItem && originalItem) {
                                    // #4: Build change log
                                    const changes: { field: string; oldVal: string; newVal: string }[] = []
                                    if (editingItem.quantity !== originalItem.quantity)
                                        changes.push({ field: 'quantity', oldVal: String(originalItem.quantity), newVal: String(editingItem.quantity) })
                                    if (editingItem.discountPercent !== originalItem.discountPercent)
                                        changes.push({ field: 'discountPercent', oldVal: String(originalItem.discountPercent), newVal: String(editingItem.discountPercent) })
                                    if (editingItem.taxPercent !== originalItem.taxPercent)
                                        changes.push({ field: 'taxPercent', oldVal: String(originalItem.taxPercent), newVal: String(editingItem.taxPercent) })
                                    updateItemInBill(bill.id, editingItem, changes)
                                }
                                setEditingItem(null)
                                setOriginalItem(null)
                            }}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* #13: Confirm Finalize */}
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
                        <AlertDialogAction onClick={() => { closeBill(bill.id); setConfirmFinalize(false) }}>
                            Yes, Finalize
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* #13: Confirm Void */}
            <AlertDialog open={confirmVoid} onOpenChange={setConfirmVoid}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Void This Bill?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will cancel the bill permanently. It cannot be reopened.
                            Are you sure you want to proceed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => { voidBill(bill.id); setActiveBillId(null); setConfirmVoid(false) }}
                        >
                            Yes, Void Bill
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
