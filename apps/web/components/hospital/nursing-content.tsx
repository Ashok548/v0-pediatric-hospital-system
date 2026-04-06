"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAdmissions } from "@/lib/api/admissions"
import { useOPVisits, updateOPVisitStatus, type OPVisit } from "@/lib/api/op-visits"
import { BedDouble, Search, Activity, Heart, Wind, Thermometer, Clock, Loader2, FileText, ClipboardList, CheckCircle2, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { HandoverSheet } from "./nursing/handover-sheet"
import { toast } from "@/hooks/use-toast"

const TRIAGE_LEVEL_CONFIG = {
    RED:    { label: "Immediate",   className: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300" },
    ORANGE: { label: "Urgent",      className: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300" },
    YELLOW: { label: "Less Urgent", className: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300" },
    GREEN:  { label: "Non-Urgent",  className: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300" },
} as const

type TriageLevel = keyof typeof TRIAGE_LEVEL_CONFIG

const DEPT_COLOR: Record<string, string> = {
    NICU: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    PICU: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    Surgery: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    General: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
}

// ─── Triage Form Modal ────────────────────────────────────────────────────────
function TriageModal({
    visit,
    onClose,
    onSuccess,
}: {
    visit: OPVisit
    onClose: () => void
    onSuccess: () => void
}) {
    const [triageLevel, setTriageLevel] = useState<TriageLevel | "">("")
    const [triageNotes, setTriageNotes] = useState("")
    const [saving, setSaving] = useState(false)

    async function handleSubmit() {
        if (!triageLevel) return
        setSaving(true)
        try {
            await updateOPVisitStatus(visit.id, "TRIAGED", { triageLevel, triageNotes: triageNotes || undefined })
            toast({ title: "Patient triaged", description: `${visit.patient.firstName} ${visit.patient.lastName} moved to TRIAGED.` })
            onSuccess()
        } catch (e: any) {
            toast({ title: "Failed", description: e?.message ?? "Could not save triage", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Triage — {visit.patient.firstName} {visit.patient.lastName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label>Triage Level <span className="text-destructive">*</span></Label>
                        <Select value={triageLevel} onValueChange={(v) => setTriageLevel(v as TriageLevel)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select priority..." />
                            </SelectTrigger>
                            <SelectContent>
                                {(Object.keys(TRIAGE_LEVEL_CONFIG) as TriageLevel[]).map(lvl => (
                                    <SelectItem key={lvl} value={lvl}>
                                        <span className={`inline-flex items-center gap-1.5 font-medium`}>
                                            <span className={`inline-block w-2 h-2 rounded-full ${
                                                lvl === "RED" ? "bg-red-500" :
                                                lvl === "ORANGE" ? "bg-orange-500" :
                                                lvl === "YELLOW" ? "bg-yellow-500" : "bg-green-500"
                                            }`} />
                                            {TRIAGE_LEVEL_CONFIG[lvl].label}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Triage Notes</Label>
                        <Textarea
                            placeholder="Chief complaint, initial observations..."
                            rows={3}
                            value={triageNotes}
                            onChange={e => setTriageNotes(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!triageLevel || saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Triage
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── OP Triage Tab ────────────────────────────────────────────────────────────
function OPTriageContent() {
    const [search, setSearch] = useState("")
    const { opVisits, isLoading, mutate } = useOPVisits({ status: "REGISTERED" })
    const { opVisits: triaged, isLoading: triageLoading, mutate: mutateTriaged } = useOPVisits({ status: "TRIAGED" })
    const [triageTarget, setTriageTarget] = useState<OPVisit | null>(null)
    const [advancingId, setAdvancingId] = useState<string | null>(null)

    const allVisits = [...opVisits, ...triaged]
    const filtered = allVisits.filter(v =>
        `${v.patient.firstName} ${v.patient.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        v.patient.uhid.toLowerCase().includes(search.toLowerCase()) ||
        v.opNumber.toLowerCase().includes(search.toLowerCase())
    )

    async function handleAdvanceToPreconsult(visit: OPVisit) {
        setAdvancingId(visit.id)
        try {
            await updateOPVisitStatus(visit.id, "PRE_CONSULT")
            toast({ title: "Patient sent to waiting room", description: `${visit.patient.firstName} ${visit.patient.lastName} is now PRE_CONSULT.` })
            mutateTriaged()
        } catch (e: any) {
            toast({ title: "Failed", description: e?.message ?? "Could not advance status", variant: "destructive" })
        } finally {
            setAdvancingId(null)
        }
    }

    const loading = isLoading || triageLoading

    return (
        <div className="space-y-4">
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search patient, UHID or OP number..."
                    className="pl-9"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">No patients awaiting triage.</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filtered.map(visit => {
                        const isTriaged = visit.status === "TRIAGED"
                        const lvl = visit.triageLevel ? TRIAGE_LEVEL_CONFIG[visit.triageLevel as TriageLevel] : null
                        return (
                            <Card key={visit.id} className={`flex flex-col border-l-4 ${
                                isTriaged ? "border-l-blue-500" : "border-l-gray-300"
                            }`}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-semibold">{visit.patient.firstName} {visit.patient.lastName}</p>
                                            <p className="text-xs text-muted-foreground">{visit.patient.uhid} · {visit.opNumber}</p>
                                        </div>
                                        <Badge variant="outline" className={isTriaged ? "border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-900/20" : "text-muted-foreground"}>
                                            {isTriaged ? "Triaged" : "Registered"}
                                        </Badge>
                                    </div>
                                    {lvl && (
                                        <span className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 border w-fit ${lvl.className}`}>
                                            <AlertTriangle className="h-3 w-3" />
                                            {lvl.label}
                                        </span>
                                    )}
                                </CardHeader>
                                <CardContent className="flex-1 space-y-2">
                                    <div className="text-xs text-muted-foreground">
                                        <span className="font-medium">Dept:</span> {visit.department}
                                        {visit.appointment && (
                                            <span className="ml-3 font-medium">Token #{visit.appointment.token}</span>
                                        )}
                                    </div>
                                    {visit.triageNotes && (
                                        <p className="text-xs text-muted-foreground italic line-clamp-2">{visit.triageNotes}</p>
                                    )}
                                    <div className="flex gap-2 pt-1">
                                        {!isTriaged ? (
                                            <Button size="sm" className="flex-1" onClick={() => setTriageTarget(visit)}>
                                                <ClipboardList className="mr-2 h-4 w-4" />
                                                Triage Now
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                className="flex-1"
                                                variant="secondary"
                                                disabled={advancingId === visit.id}
                                                onClick={() => handleAdvanceToPreconsult(visit)}
                                            >
                                                {advancingId === visit.id
                                                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                                Send to Doctor
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {triageTarget && (
                <TriageModal
                    visit={triageTarget}
                    onClose={() => setTriageTarget(null)}
                    onSuccess={() => { setTriageTarget(null); mutate(); mutateTriaged(); }}
                />
            )}
        </div>
    )
}

export function NursingContent() {
    const [search, setSearch] = useState("")
    const { admissions = [], isLoading } = useAdmissions({ status: "ADMITTED" })

    const filtered = admissions.filter(a =>
        `${a.patient.firstName} ${a.patient.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        a.patient.uhid.toLowerCase().includes(search.toLowerCase()) ||
        a.admissionNumber.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex-1 space-y-6 p-6 pt-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Nursing Station</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Monitor admitted patients — chart vitals and log fluid I/O
                    </p>
                </div>
                <HandoverSheet />
            </div>

            <Tabs defaultValue="inpatient">
                <TabsList>
                    <TabsTrigger value="inpatient" className="gap-2">
                        <BedDouble className="h-4 w-4" /> Inpatient
                    </TabsTrigger>
                    <TabsTrigger value="op-triage" className="gap-2">
                        <ClipboardList className="h-4 w-4" /> OP Triage
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="inpatient" className="space-y-6 mt-4">
                    {/* Summary Cards */}
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <BedDouble className="h-4 w-4" /> Currently Admitted
                                </CardTitle>
                            </CardHeader>
                            <CardContent><p className="text-2xl font-bold">{admissions.length}</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-purple-500" /> NICU
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold text-purple-600">
                                    {admissions.filter(a => a.department === "NICU").length}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-red-500" /> PICU
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold text-red-600">
                                    {admissions.filter(a => a.department === "PICU").length}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-blue-500" /> General
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold text-blue-600">
                                    {admissions.filter(a => a.department === "General").length}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-orange-500" /> Surgery
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold text-orange-600">
                                    {admissions.filter(a => a.department === "Surgery").length}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Search */}
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search patient or admission ID..."
                            className="pl-9"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Patient Cards */}
                    {isLoading ? (
                        <div className="flex h-40 items-center justify-center col-span-full">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground delay-150" />
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {filtered.map(adm => {
                                const latest = (adm as any).vitalsRecords?.[0]
                                const deptColor = DEPT_COLOR[adm.department] ?? "bg-gray-100 text-gray-700"
                                return (
                                    <Card key={adm.id} className="hover:shadow-md transition-shadow flex flex-col">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-semibold text-base">{adm.patient.firstName} {adm.patient.lastName}</p>
                                                    <p className="text-xs text-muted-foreground">{adm.patient.uhid}</p>
                                                </div>
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${deptColor}`}>
                                                    {adm.department}
                                                </span>
                                            </div>
                                            {adm.currentBed && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                                    <BedDouble className="h-3.5 w-3.5" />
                                                    {adm.currentBed.ward.name} / <strong>{adm.currentBed.bedNumber}</strong>
                                                </div>
                                            )}
                                        </CardHeader>
                                        <CardContent className="space-y-3 flex-1 flex flex-col">
                                            {latest ? (
                                                <div className="grid grid-cols-3 gap-2 bg-muted/40 rounded-lg p-3">
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <Heart className="h-3.5 w-3.5 text-red-500" />
                                                        <span className="text-sm font-bold">{latest.heartRate}</span>
                                                        <span className="text-[10px] text-muted-foreground">HR</span>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <Wind className="h-3.5 w-3.5 text-blue-500" />
                                                        <span className="text-sm font-bold">{latest.spo2}%</span>
                                                        <span className="text-[10px] text-muted-foreground">SpO2</span>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <Thermometer className="h-3.5 w-3.5 text-orange-500" />
                                                        <span className="text-sm font-bold">{latest.temperature}°</span>
                                                        <span className="text-[10px] text-muted-foreground">Temp</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-muted/40 rounded-lg p-3 text-center text-xs text-muted-foreground h-[68px] flex items-center justify-center">
                                                    No vitals charted yet
                                                </div>
                                            )}
                                            {latest && (
                                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    Last charted {formatDistanceToNow(new Date(latest.recordedAt), { addSuffix: true })}
                                                    {" "}by {latest.recordedBy}
                                                </div>
                                            )}
                                            <div className="mt-auto pt-2 grid grid-cols-2 gap-2">
                                                <Link href={`/nursing/${adm.id}/vitals`}>
                                                    <Button variant="secondary" size="sm" className="w-full gap-2">
                                                        <Activity className="h-4 w-4" />
                                                        Vitals & Charting
                                                    </Button>
                                                </Link>
                                                <Link href={`/nursing/${adm.id}/notes`}>
                                                    <Button variant="outline" size="sm" className="w-full gap-2 text-muted-foreground">
                                                        <FileText className="h-4 w-4" />
                                                        View Notes
                                                    </Button>
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                            {!isLoading && filtered.length === 0 && (
                                <div className="col-span-full text-center text-muted-foreground py-12">
                                    No admitted patients found.
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="op-triage" className="mt-4">
                    <OPTriageContent />
                </TabsContent>
            </Tabs>
        </div>
    )
}
