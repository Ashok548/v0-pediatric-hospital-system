"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ApiBill } from "@/lib/types/billing"

export function PatientBillInfo({ bill, isReadOnly }: { bill: ApiBill, isReadOnly?: boolean }) {
    const pName = bill.patient ? `${bill.patient.firstName} ${bill.patient.lastName}` : "Unknown Patient"
    const uhid = bill.patient?.uhid || "Unknown UHID"
    const dept = bill.admission?.department || "Outpatient"
    const doctor = (bill as any).doctorName || "—"

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
                    <Label>Bill Date</Label>
                    <Input value={new Date(bill.createdAt).toLocaleDateString()} readOnly className="bg-muted" />
                </div>

                <div className="space-y-2">
                    <Label>Department</Label>
                    <Input value={dept} readOnly className="bg-muted" />
                </div>

                <div className="space-y-2">
                    <Label>Doctor / Consultant</Label>
                    <Input value={doctor} readOnly className="bg-muted" />
                </div>
            </CardContent>
        </Card>
    )
}
