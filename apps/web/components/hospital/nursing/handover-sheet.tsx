"use client"

import { useState } from "react"
import { useHandoverSummary } from "@/lib/api/nursing"
import { useQuery } from "@/hooks/use-query"
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Activity, Clock, FileText, Heart, Thermometer, Wind, AlertCircle, Loader2 } from "lucide-react"

export function HandoverSheet() {
    const [department, setDepartment] = useState("Neonatal ICU")
    const [shift, setShift] = useState("MORNING")

    // Fetch active departments for the dropdown
    const { data: deptResponse } = useQuery<any>("/master/departments?limit=100&status=ACTIVE")
    const departments = deptResponse?.data ?? []

    // Fetch admissions based on selected department and shift
    const { admissions, isLoading } = useHandoverSummary(department, shift)

    const priorityColor: Record<string, string> = {
        NORMAL: "bg-blue-100 text-blue-700",
        URGENT: "bg-orange-100 text-orange-700",
        CRITICAL: "bg-red-100 text-red-700"
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <FileText className="h-4 w-4" /> Shift Handover
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl md:max-w-2xl overflow-y-auto pr-0 pb-0">
                <SheetHeader className="pr-6">
                    <SheetTitle>Clinical Handover</SheetTitle>
                    <SheetDescription>
                        Summary of patients, latest vitals, and recent nursing notes for the selected shift.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex gap-3 py-4 pr-6 sticky top-0 bg-background/95 backdrop-blur z-10 border-b mb-4">
                    <Select value={department} onValueChange={setDepartment}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                            {departments.map((d: any) => (
                                <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={shift} onValueChange={setShift}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Shift" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="MORNING">Morning (8A-4P)</SelectItem>
                            <SelectItem value="AFTERNOON">Afternoon (4P-12A)</SelectItem>
                            <SelectItem value="NIGHT">Night (12A-8A)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="pr-6 pb-20 space-y-6">
                    {isLoading ? (
                        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                    ) : admissions.length === 0 ? (
                        <div className="text-center p-12 py-24 border border-dashed rounded-lg bg-muted/30">
                            <p className="text-muted-foreground">No patients currently admitted in {department}.</p>
                        </div>
                    ) : (
                        admissions.map(adm => {
                            const latestVitals = adm.vitalsRecords?.[0]
                            const notes = adm.nursingNotes || []

                            return (
                                <Card key={adm.id} className="overflow-hidden border-muted">
                                    <div className="bg-muted/40 p-3 px-4 flex items-center justify-between border-b">
                                        <div>
                                            <p className="font-semibold text-base">{adm.patient.firstName} {adm.patient.lastName}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                {adm.patient.uhid}
                                                {adm.currentBed && (
                                                    <span>· {adm.currentBed.ward.name} / {adm.currentBed.bedNumber}</span>
                                                )}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="bg-background">{adm.admissionNumber}</Badge>
                                    </div>
                                    <CardContent className="p-4 space-y-4">

                                        {/* Vitals Snapshot */}
                                        <div>
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <Activity className="h-3.5 w-3.5" /> Latest Vitals
                                            </h4>
                                            {latestVitals ? (
                                                <div className="grid grid-cols-4 gap-2">
                                                    <div className="bg-red-50/50 p-2 rounded flex items-center justify-between">
                                                        <span className="text-[10px] text-muted-foreground font-medium">HR</span>
                                                        <span className="text-sm font-bold text-red-700 flex items-center gap-1"><Heart className="h-3 w-3" /> {latestVitals.heartRate}</span>
                                                    </div>
                                                    <div className="bg-blue-50/50 p-2 rounded flex items-center justify-between">
                                                        <span className="text-[10px] text-muted-foreground font-medium">SpO2</span>
                                                        <span className="text-sm font-bold text-blue-700 flex items-center gap-1"><Wind className="h-3 w-3" /> {latestVitals.spo2}%</span>
                                                    </div>
                                                    <div className="bg-orange-50/50 p-2 rounded flex items-center justify-between">
                                                        <span className="text-[10px] text-muted-foreground font-medium">Temp</span>
                                                        <span className="text-sm font-bold text-orange-700 flex items-center gap-1"><Thermometer className="h-3 w-3" /> {latestVitals.temperature}°</span>
                                                    </div>
                                                    <div className="bg-purple-50/50 p-2 rounded flex items-center justify-between">
                                                        <span className="text-[10px] text-muted-foreground font-medium">RR</span>
                                                        <span className="text-sm font-bold text-purple-700">{latestVitals.respiratoryRate || '--'}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-muted-foreground italic">No vitals recorded yet.</p>
                                            )}
                                        </div>

                                        {/* Shift Notes */}
                                        <div>
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <FileText className="h-3.5 w-3.5" /> Handover & Notes ({shift})
                                            </h4>
                                            {notes.length > 0 ? (
                                                <div className="space-y-2 relative before:absolute before:inset-y-0 before:left-2 before:w-px before:bg-border pl-6">
                                                    {notes.map(note => (
                                                        <div key={note.id} className="relative">
                                                            <div className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border-2 border-background ${note.priority === 'CRITICAL' ? 'bg-red-500' :
                                                                note.priority === 'URGENT' ? 'bg-orange-500' : 'bg-blue-500'
                                                                }`} />
                                                            <div className="bg-muted/20 rounded-md p-2.5 text-sm border">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <div className="flex gap-2 items-center">
                                                                        <span className="font-medium text-xs text-foreground/80">{note.recordedBy}</span>
                                                                        <Badge variant="secondary" className="text-[9px] h-4 px-1">{note.noteType}</Badge>
                                                                    </div>
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        {new Date(note.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                                <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{note.content}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded border border-dashed">No notes recorded during this shift.</p>
                                            )}
                                        </div>

                                    </CardContent>
                                </Card>
                            )
                        })
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
