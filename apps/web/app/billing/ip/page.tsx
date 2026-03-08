"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { MappedBillStatusColors } from "@/lib/types/billing"
import { FileText, ArrowRight, Loader2 } from "lucide-react"
import { useBills } from "@/lib/api/billing"

export default function IPRunningBillsPage() {
    const router = useRouter()

    // Fetch draft/active bills. For a real app we might paginate or filter by specific statuses through API.
    // Here we fetch recent bills and filter client-side for "Inpatient" (has admissionId).
    const { bills, isLoading } = useBills({ limit: 100 })

    const ipBills = bills.filter(b => b.admissionId && (b.status === 'DRAFT' || b.status === 'PARTIALLY_PAID' || b.status === 'FINAL'))

    const formatAcc = (num: number | string) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(num))

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">IP Running Bills</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage running charges for admitted patients</p>
                </div>
            </div>

            <Card>
                <CardHeader className="py-4 border-b">
                    <CardTitle className="text-base">Admitted Patients Ledger</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Admission ID</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Patient Info</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Running Total</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Advance Paid</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Balance Due</th>
                                    <th className="px-4 py-3 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="animate-spin size-5" />
                                                <span>Loading running bills...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : ipBills.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                            No active inpatient bills found.
                                        </td>
                                    </tr>
                                ) : (
                                    ipBills.map((bill) => {
                                        const isClosed = bill.status === 'PAID'
                                        const statusObj = MappedBillStatusColors[bill.status] || { label: bill.status, className: "bg-muted" }

                                        const pName = bill.patient ? `${bill.patient.firstName} ${bill.patient.lastName}` : "Unknown"
                                        const pUhid = bill.patient?.uhid || "Unknown"

                                        return (
                                            <tr key={bill.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-4 py-4 font-mono text-sm">{bill.admissionId}</td>
                                                <td className="px-4 py-4">
                                                    <p className="font-semibold">{pName}</p>
                                                    <p className="text-xs text-muted-foreground">UHID: {pUhid}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge variant="outline" className={statusObj.className}>
                                                        {statusObj.label}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4 text-right">{formatAcc(bill.netAmount)}</td>
                                                <td className="px-4 py-4 text-right text-green-600 font-medium">
                                                    {formatAcc(bill.paidAmount)}
                                                </td>
                                                <td className="px-4 py-4 text-right font-bold text-red-600">
                                                    {formatAcc(bill.dueAmount)}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        className="gap-2 text-primary hover:text-primary/80"
                                                        onClick={() => router.push(`/billing/ip/${bill.admissionId}`)}
                                                    >
                                                        <FileText className="size-4" />
                                                        {isClosed ? "View Bill" : "Manage"}
                                                        <ArrowRight className="size-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

        </div>
    )
}
