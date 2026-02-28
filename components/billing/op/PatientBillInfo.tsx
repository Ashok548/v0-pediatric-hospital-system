"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function PatientBillInfo({ bill, isReadOnly }: { bill: any, isReadOnly?: boolean }) {
    return (
        <Card>
            <CardHeader className="py-4 border-b">
                <CardTitle className="text-base font-semibold">Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>Patient Name</Label>
                    <Input value={bill.patientName || ""} readOnly={isReadOnly} />
                </div>
                <div className="space-y-2">
                    <Label>UHID</Label>
                    <Input value={bill.patientId || ""} readOnly={isReadOnly} />
                </div>
                <div className="space-y-2">
                    <Label>Visit ID & Date</Label>
                    <Input value={`${bill.visitId || "Auto-generated"} - ${new Date(bill.date).toLocaleDateString()}`} readOnly />
                </div>

                <div className="space-y-2">
                    <Label>Department</Label>
                    <Select disabled={isReadOnly} defaultValue="pediatrics">
                        <SelectTrigger>
                            <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pediatrics">Pediatrics</SelectItem>
                            <SelectItem value="neonatology">Neonatology</SelectItem>
                            <SelectItem value="surgery">Surgery</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Doctor</Label>
                    <Select disabled={isReadOnly} defaultValue="dr-sharma">
                        <SelectTrigger>
                            <SelectValue placeholder="Select Doctor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="dr-sharma">Dr. Sharma</SelectItem>
                            <SelectItem value="dr-patel">Dr. Patel</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    )
}
