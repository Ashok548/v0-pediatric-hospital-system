"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ApiBill } from "@/lib/types/billing"
import { Stethoscope, Hash, CalendarDays } from "lucide-react"

export function PatientBillInfo({ bill, isReadOnly }: { bill: ApiBill, isReadOnly?: boolean }) {
    const pName = bill.patient ? `${bill.patient.firstName} ${bill.patient.lastName}` : "Unknown Patient"
    const uhid = bill.patient?.uhid || "Unknown UHID"
    const phone = bill.patient?.phone || "—"

    // Real data from opVisit relation (populated by BILL_INCLUDE)
    const doctorName = bill.opVisit?.doctor?.name || bill.admission?.department || "—"
    const opNumber = bill.opVisit?.opNumber || "—"
    const department = bill.opVisit?.department || bill.admission?.department || "Outpatient"
    const visitDate = bill.opVisit?.visitDate
        ? new Date(bill.opVisit.visitDate).toLocaleDateString("en-IN", { dateStyle: "medium" })
        : new Date(bill.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })

    return (
        <Card>
            <CardHeader className="py-4 border-b">
                <CardTitle className="text-base font-semibold">Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>Patient Name</Label>
                    <Input value={pName} readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                    <Label>UHID</Label>
                    <Input value={uhid} readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={phone} readOnly className="bg-muted" />
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                        <Stethoscope className="size-3.5 text-muted-foreground" /> Doctor / Consultant
                    </Label>
                    <Input value={doctorName} readOnly className="bg-muted" />
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                        <Hash className="size-3.5 text-muted-foreground" /> OP Number
                    </Label>
                    <Input value={opNumber} readOnly className="bg-muted font-mono" />
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                        <CalendarDays className="size-3.5 text-muted-foreground" /> Visit Date
                    </Label>
                    <Input value={visitDate} readOnly className="bg-muted" />
                </div>

                <div className="space-y-2 md:col-span-3">
                    <Label>Department</Label>
                    <Input value={department} readOnly className="bg-muted" />
                </div>
            </CardContent>
        </Card>
    )
}
