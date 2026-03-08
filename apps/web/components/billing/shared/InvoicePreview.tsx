"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Printer, ArrowLeft, Download, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useBill } from "@/lib/api/billing"
import { MappedBillStatusColors } from "@/lib/types/billing"

export function InvoicePreview({ id }: { id: string }) {
    const router = useRouter()

    const { bill, isLoading } = useBill(id)

    if (isLoading) {
        return <div className="p-12 flex justify-center"><Loader2 className="animate-spin size-8 text-primary" /></div>
    }

    if (!bill) {
        return <div className="p-8 text-center text-muted-foreground">Invoice not found.</div>
    }

    const formatAcc = (num: number | string) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(num))

    const pName = bill.patient ? `${bill.patient.firstName} ${bill.patient.lastName}` : "Unknown Patient"
    const pUhid = bill.patient?.uhid || "Unknown UHID"
    const typeLabel = bill.admissionId ? 'Inpatient (IPD)' : 'Outpatient (OPD)'

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Actions Config */}
            <div className="flex items-center justify-between no-print">
                <Button variant="ghost" className="gap-2" onClick={() => router.back()}>
                    <ArrowLeft className="size-4" /> Back
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={() => window.print()}
                        title="Use browser 'Save as PDF' in print dialog for PDF export">
                        <Download className="size-4" /> Save as PDF
                    </Button>
                    <Button className="gap-2" onClick={() => window.print()}>
                        <Printer className="size-4" /> Print Invoice
                    </Button>
                </div>
            </div>

            {/* Invoice Document */}
            <Card className="bg-white text-zinc-900 border-zinc-200 print:border-none print:shadow-none min-h-[800px]">
                <CardContent className="p-8 sm:p-12 space-y-8">

                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900">CARE PEDIATRICS</h1>
                            <p className="text-sm text-zinc-600 mt-1">Multi-Speciality Child Care Hospital</p>
                            <p className="text-sm text-zinc-600">123 Health Avenue, Medical District</p>
                            <p className="text-sm text-zinc-600 font-medium mt-1">GSTIN: 29ABCDE1234F1Z5</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-bold text-zinc-400 uppercase tracking-widest">Invoice</h2>
                            <p className="text-sm font-semibold mt-2">No: {bill.billNumber || bill.id.slice(-6).toUpperCase()}</p>
                            <p className="text-sm text-zinc-600">Date: {new Date(bill.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                    </div>

                    <Separator className="bg-zinc-200" />

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-8 text-sm">
                        <div className="space-y-1">
                            <p className="text-zinc-500 font-medium">Billed To:</p>
                            <p className="font-semibold text-zinc-900 text-base">{pName}</p>
                            <p className="text-zinc-600">UHID: {pUhid}</p>
                            {bill.admissionId && <p className="text-zinc-600">Admission No: {bill.admissionId}</p>}
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-zinc-500 font-medium">Type:</p>
                            <p className="font-semibold text-zinc-900">{typeLabel}</p>
                            <p className="text-zinc-600">Status: {MappedBillStatusColors[bill.status]?.label || bill.status}</p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="pt-4">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-zinc-900">
                                    <th className="py-2 text-left font-semibold text-zinc-900">Description</th>
                                    <th className="py-2 text-center font-semibold text-zinc-900">Qty</th>
                                    <th className="py-2 text-right font-semibold text-zinc-900">Rate</th>
                                    <th className="py-2 text-right font-semibold text-zinc-900">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200">
                                {bill.items && bill.items.length > 0 ? (
                                    bill.items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="py-3">
                                                <p className="font-medium text-zinc-900">{item.serviceName}</p>
                                                <p className="text-xs text-zinc-500">{item.serviceCode}</p>
                                            </td>
                                            <td className="py-3 text-center text-zinc-700">{item.quantity}</td>
                                            <td className="py-3 text-right text-zinc-700">{formatAcc(item.unitPrice)}</td>
                                            <td className="py-3 text-right font-medium text-zinc-900">{formatAcc(item.totalPrice)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={4} className="py-6 text-center text-zinc-500 italic">No bill items found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Calculations */}
                    <div className="flex justify-end pt-4">
                        <div className="w-full max-w-sm space-y-3 text-sm">
                            <div className="flex justify-between items-center text-zinc-600">
                                <span>Subtotal</span>
                                <span>{formatAcc(bill.totalAmount)}</span>
                            </div>
                            {Number(bill.discountAmount) > 0 && (
                                <div className="flex justify-between items-center text-green-600">
                                    <span>Discount</span>
                                    <span>-{formatAcc(bill.discountAmount)}</span>
                                </div>
                            )}
                            {Number(bill.taxAmount) > 0 && (
                                <div className="flex justify-between items-center text-zinc-600">
                                    <span>Tax Amount</span>
                                    <span>+{formatAcc(bill.taxAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center font-bold text-base pt-3 border-t border-zinc-900 text-zinc-900">
                                <span>Grand Total</span>
                                <span>{formatAcc(bill.netAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-zinc-600 pt-2">
                                <span>Amount Paid</span>
                                <span>{formatAcc(bill.paidAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center font-bold text-base pt-3 border-t border-zinc-200 text-zinc-900">
                                <span>Balance Due</span>
                                <span>{formatAcc(bill.dueAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Notes */}
                    <div className="pt-16 pb-8 text-sm text-zinc-500">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="font-medium text-zinc-900 mb-1">Terms & Conditions</p>
                                <p>1. This is a computer generated invoice and does not require physical signature.</p>
                                <p>2. Payment is due upon receipt.</p>
                                <p>3. Goods/Services once billed cannot be cancelled.</p>
                            </div>
                            <div className="text-center pt-8 border-t border-zinc-300 w-48">
                                <p className="font-medium text-zinc-900">Authorized Signatory</p>
                            </div>
                        </div>
                    </div>

                </CardContent>
            </Card>

        </div>
    )
}
