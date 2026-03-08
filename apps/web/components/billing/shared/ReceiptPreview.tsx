"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Printer, ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useBill } from "@/lib/api/billing"

export function ReceiptPreview({ id }: { id: string }) {
    const router = useRouter()
    const { bill, isLoading } = useBill(id)

    if (isLoading) {
        return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary size-8" /></div>
    }

    if (!bill) {
        return <div className="p-8 text-center text-muted-foreground">Receipt not found.</div>
    }

    const fmt = (n: number | string) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Math.abs(Number(n)))

    const isRefund = Number(bill.dueAmount) < 0
    const closedDate = new Date().toLocaleDateString('en-IN')

    const pName = bill.patient ? `${bill.patient.firstName} ${bill.patient.lastName}` : "Unknown"
    const pUhid = bill.patient?.uhid || "Unknown UHID"

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Actions */}
            <div className="flex items-center justify-between no-print">
                <Button variant="ghost" className="gap-2" onClick={() => router.back()}>
                    <ArrowLeft className="size-4" /> Back
                </Button>
                <Button className="gap-2" onClick={() => window.print()}>
                    <Printer className="size-4" /> Print Receipt
                </Button>
            </div>

            {/* Receipt Document */}
            <Card className="bg-white text-zinc-900 border-zinc-200 print:border-none print:shadow-none">
                <CardContent className="p-8 sm:p-12 space-y-6">

                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-900">CARE PEDIATRICS</h1>
                            <p className="text-sm text-zinc-600">Multi-Speciality Child Care Hospital</p>
                            <p className="text-sm text-zinc-600">GSTIN: 29ABCDE1234F1Z5</p>
                        </div>
                        <div className="text-right">
                            <Badge className={isRefund ? "bg-orange-600" : "bg-green-600"} >
                                {isRefund ? "REFUND RECEIPT" : "PAYMENT RECEIPT"}
                            </Badge>
                            <p className="text-sm font-semibold mt-2">Ref: {bill.billNumber || bill.id.slice(-6).toUpperCase()}</p>
                            <p className="text-sm text-zinc-600">Date: {closedDate}</p>
                        </div>
                    </div>

                    <Separator className="bg-zinc-200" />

                    {/* Patient */}
                    <div className="flex justify-between text-sm gap-4">
                        <div>
                            <p className="text-zinc-500 font-medium">Received From:</p>
                            <p className="font-semibold text-zinc-900 text-base">{pName}</p>
                            <p className="text-zinc-600">UHID: {pUhid}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-zinc-500 font-medium">Billing Type:</p>
                            <p className="font-semibold text-zinc-900">{bill.admissionId ? 'Inpatient (IPD)' : 'Outpatient (OPD)'}</p>
                        </div>
                    </div>

                    {/* Services Table */}
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b-2 border-zinc-900">
                                <th className="py-2 text-left font-semibold">Description</th>
                                <th className="py-2 text-center font-semibold">Qty</th>
                                <th className="py-2 text-right font-semibold">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {bill.items && bill.items.length > 0 ? (
                                bill.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-2.5">
                                            <p className="font-medium">{item.serviceName}</p>
                                            <p className="text-xs text-zinc-400">{item.serviceCode}</p>
                                        </td>
                                        <td className="py-2.5 text-center text-zinc-600">{item.quantity}</td>
                                        <td className="py-2.5 text-right font-medium">{fmt(item.totalPrice)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={3} className="py-6 text-center text-zinc-500 italic">No items found.</td></tr>
                            )}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end border-t pt-4">
                        <div className="w-full max-w-xs space-y-2 text-sm">
                            <div className="flex justify-between text-zinc-600">
                                <span>Subtotal</span>
                                <span>{fmt(bill.totalAmount)}</span>
                            </div>
                            {Number(bill.discountAmount) > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discount</span>
                                    <span>-{fmt(bill.discountAmount)}</span>
                                </div>
                            )}
                            {Number(bill.taxAmount) > 0 && (
                                <div className="flex justify-between text-zinc-600">
                                    <span>Tax</span>
                                    <span>+{fmt(bill.taxAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-base pt-2 border-t border-zinc-900">
                                <span>Grand Total</span>
                                <span>{fmt(bill.netAmount)}</span>
                            </div>
                            <div className="flex justify-between text-zinc-600 pt-1">
                                <span>Total Paid</span>
                                <span className="text-green-600 font-medium">{fmt(bill.paidAmount)}</span>
                            </div>
                            <div className={`flex justify-between font-bold text-base pt-2 border-t border-zinc-200 ${isRefund ? "text-orange-700" : "text-green-700"}`}>
                                <span>{isRefund ? "Refund Issued" : "Balance Settled"}</span>
                                <span>{fmt(bill.dueAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-8 text-center space-y-1">
                        <p className="text-sm font-semibold text-zinc-700">
                            {isRefund
                                ? `Refund processed.`
                                : "Payment received in full. Thank you!"
                            }
                        </p>
                        <p className="text-xs text-zinc-400">This is a computer generated receipt. No signature required.</p>
                    </div>

                </CardContent>
            </Card>

        </div>
    )
}
