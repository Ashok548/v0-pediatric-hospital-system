"use client"

import { useState } from "react"
import { useAdmission } from "@/lib/api/admissions"
import { useAdmissionVitals, useRecordVitals } from "@/lib/api/nicu"
import { useIoRecords, useCreateIoRecord, useDeleteIoRecord, useUpdateIoRecord, useDeleteVitalRecord } from "@/lib/api/nursing"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { VoiceRecorder } from "@/components/VoiceRecorder"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from "@/components/ui/dialog"
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import { format } from "date-fns"
import { Activity, Droplet, Heart, Plus, Thermometer, Wind, ArrowLeft, Loader2, FileText, Trash2, Edit2, Check, X as XIcon } from "lucide-react"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { toast } from "sonner"
import { NotesPanel } from "./nursing/notes-panel"
import { appendTranscript } from "@/lib/utils/transcript"

const IO_ROUTES = ["Oral", "IV Fluid", "NG Tube", "Urine", "NG Aspirate", "Drain", "Other"]

interface Props { admissionId: string }

export function VitalsChartContent({ admissionId }: Props) {
    const { admission: adm, isLoading: loadingAdm } = useAdmission(admissionId)
    const { vitals, isLoading: loadingVitals } = useAdmissionVitals(admissionId)
    const { records: io, isLoading: loadingIo } = useIoRecords(admissionId)
    const recordVitals = useRecordVitals()
    const recordIo = useCreateIoRecord()
    const deleteIo = useDeleteIoRecord()
    const updateIo = useUpdateIoRecord()
    const deleteVital = useDeleteVitalRecord()

    const [vitalOpen, setVitalOpen] = useState(false)
    const [ioOpen, setIoOpen] = useState(false)
    const [ioToDelete, setIoToDelete] = useState<string | null>(null)
    const [isDeletingIo, setIsDeletingIo] = useState(false)
    const [vitalToDelete, setVitalToDelete] = useState<string | null>(null)
    const [isDeletingVital, setIsDeletingVital] = useState(false)

    // I/O inline edit state
    const [editingIoId, setEditingIoId] = useState<string | null>(null)
    const [editingIoVals, setEditingIoVals] = useState({ ioType: "INTAKE" as "INTAKE" | "OUTPUT", route: "", volumeMl: "", notes: "" })
    const [isSavingIo, setIsSavingIo] = useState(false)

    // ── Vital form state ──────────────────────────────────────────────────────
    const [vf, setVf] = useState({ heartRate: "", spo2: "", temperature: "", respiratoryRate: "", bloodPressureSystolic: "", bloodPressureDiastolic: "", notes: "", isCritical: false, alertMessage: "" })

    // ── I/O form state ─────────────────────────────────────────────────────────
    const [iof, setIof] = useState({ ioType: "INTAKE" as "INTAKE" | "OUTPUT", route: "IV Fluid", volumeMl: "", notes: "" })

    // Reverse vitals for chart (oldest to newest left to right)
    const chartData = [...vitals].reverse().map(v => ({
        time: format(new Date(v.recordedAt), "HH:mm"),
        "HR (bpm)": v.heartRate,
        "SpO2 (%)": v.spo2,
        "Temp (°C)": v.temperature,
        "RR": v.respiratoryRate,
    }))

    // Calculate I/O Balance
    const totalIntake = io.filter(e => e.ioType === "INTAKE").reduce((acc, curr) => acc + curr.volumeMl, 0)
    const totalOutput = io.filter(e => e.ioType === "OUTPUT").reduce((acc, curr) => acc + curr.volumeMl, 0)
    const ioBalance = totalIntake - totalOutput

    async function submitVital() {
        if (!adm) return
        try {
            await recordVitals(admissionId, {
                heartRate: Number(vf.heartRate), spo2: Number(vf.spo2),
                temperature: Number(vf.temperature), respiratoryRate: Number(vf.respiratoryRate),
                bloodPressureSystolic: Number(vf.bloodPressureSystolic), bloodPressureDiastolic: Number(vf.bloodPressureDiastolic),
                notes: vf.notes || undefined,
                isCritical: vf.isCritical,
                alertMessage: vf.isCritical && vf.alertMessage ? vf.alertMessage : undefined,
            })
            setVf({ heartRate: "", spo2: "", temperature: "", respiratoryRate: "", bloodPressureSystolic: "", bloodPressureDiastolic: "", notes: "", isCritical: false, alertMessage: "" })
            setVitalOpen(false)
            toast.success("Vital reading recorded")
        } catch {
            toast.error("Failed to record vitals")
        }
    }

    async function submitIO() {
        if (!adm) return
        try {
            await recordIo(admissionId, {
                ioType: iof.ioType,
                route: iof.route,
                volumeMl: Number(iof.volumeMl),
                notes: iof.notes || undefined,
            })
            setIof({ ioType: "INTAKE", route: "IV Fluid", volumeMl: "", notes: "" })
            setIoOpen(false)
            toast.success("I/O entry recorded")
        } catch {
            toast.error("Failed to record I/O entry")
        }
    }

    async function handleDeleteIo() {
        if (!ioToDelete) return
        setIsDeletingIo(true)
        try {
            await deleteIo(ioToDelete, admissionId)
            toast.success("I/O entry deleted")
        } catch {
            toast.error("Failed to delete I/O entry")
        } finally {
            setIsDeletingIo(false)
            setIoToDelete(null)
        }
    }

    async function handleDeleteVital() {
        if (!vitalToDelete) return
        setIsDeletingVital(true)
        try {
            await deleteVital(vitalToDelete, admissionId)
            toast.success("Vital reading deleted")
        } catch {
            toast.error("Failed to delete vital reading")
        } finally {
            setIsDeletingVital(false)
            setVitalToDelete(null)
        }
    }

    function openIoEdit(e: typeof io[0]) {
        setEditingIoId(e.id)
        setEditingIoVals({ ioType: e.ioType, route: e.route, volumeMl: String(e.volumeMl), notes: e.notes ?? "" })
    }

    async function saveIoEdit() {
        if (!editingIoId) return
        setIsSavingIo(true)
        try {
            await updateIo(editingIoId, admissionId, {
                ioType: editingIoVals.ioType,
                route: editingIoVals.route,
                volumeMl: Number(editingIoVals.volumeMl),
                notes: editingIoVals.notes || undefined,
            })
            toast.success("I/O entry updated")
            setEditingIoId(null)
        } catch {
            toast.error("Failed to update I/O entry")
        } finally {
            setIsSavingIo(false)
        }
    }

    const latest = vitals[0] // API returns descending by default

    return (
        <div className="flex-1 space-y-6 p-6 pt-4">
            {/* Back + Header */}
            <div className="flex items-center gap-3">
                <Link href="/nursing">
                    <Button variant="ghost" size="sm" className="gap-1.5">
                        <ArrowLeft className="h-4 w-4" /> Nursing Station
                    </Button>
                </Link>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Vitals & I/O — {adm ? `${adm.patient.firstName} ${adm.patient.lastName}` : "Loading..."}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {adm?.patient.uhid} · {adm?.currentBed?.ward.name} / <strong>{adm?.currentBed?.bedNumber}</strong>
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={ioOpen} onOpenChange={setIoOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2"><Droplet className="h-4 w-4" /> Log I/O</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Log Fluid Entry</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-2">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label>Type</Label>
                                        <Select value={iof.ioType} onValueChange={v => setIof(p => ({ ...p, ioType: v as any }))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="INTAKE">Intake</SelectItem>
                                                <SelectItem value="OUTPUT">Output</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Route</Label>
                                        <Select value={iof.route} onValueChange={v => setIof(p => ({ ...p, route: v }))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {IO_ROUTES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label>Volume (mL)</Label>
                                    <Input type="number" value={iof.volumeMl} onChange={e => setIof(p => ({ ...p, volumeMl: e.target.value }))} placeholder="e.g. 200" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIoOpen(false)}>Cancel</Button>
                                <Button onClick={submitIO} disabled={!iof.volumeMl}>Save Entry</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={vitalOpen} onOpenChange={setVitalOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Vitals</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Chart Vital Reading</DialogTitle></DialogHeader>
                            <div className="grid grid-cols-2 gap-3 py-2">
                                {[
                                    { label: "Heart Rate (bpm)", key: "heartRate", placeholder: "120" },
                                    { label: "SpO2 (%)", key: "spo2", placeholder: "97" },
                                    { label: "Temperature (°C)", key: "temperature", placeholder: "37.2" },
                                    { label: "Resp. Rate (/min)", key: "respiratoryRate", placeholder: "24" },
                                    { label: "BP Systolic", key: "bloodPressureSystolic", placeholder: "100" },
                                    { label: "BP Diastolic", key: "bloodPressureDiastolic", placeholder: "65" },
                                ].map(({ label, key, placeholder }) => (
                                    <div key={key} className="space-y-1">
                                        <Label>{label}</Label>
                                        <Input
                                            type="number"
                                            placeholder={placeholder}
                                            value={(vf as any)[key]}
                                            onChange={e => setVf(p => ({ ...p, [key]: e.target.value }))}
                                        />
                                    </div>
                                ))}
                                <div className="col-span-2 space-y-1">
                                    <Label>Notes (optional)</Label>
                                    <Textarea value={vf.notes} onChange={e => setVf(p => ({ ...p, notes: e.target.value }))} rows={2} />
                                    <VoiceRecorder
                                        onTextGenerated={(text) => setVf(p => ({ ...p, notes: appendTranscript(p.notes, text) }))}
                                    />
                                </div>
                                <div className="col-span-2 mt-2 pt-3 border-t">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="isCritical"
                                            checked={vf.isCritical}
                                            onCheckedChange={(c) => setVf(p => ({ ...p, isCritical: c === true }))}
                                            className="data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                                        />
                                        <Label htmlFor="isCritical" className="text-destructive font-medium cursor-pointer">
                                            Flag as Critical Event
                                        </Label>
                                    </div>
                                    {vf.isCritical && (
                                        <div className="mt-3 space-y-1 animate-in fade-in slide-in-from-top-1">
                                            <Label className="text-destructive">Alert Message (Required)</Label>
                                            <Input
                                                autoFocus
                                                className="border-destructive/30 focus-visible:ring-destructive/30"
                                                placeholder="e.g. SpO2 dropped to 85, oxygen administered"
                                                value={vf.alertMessage}
                                                onChange={e => setVf(p => ({ ...p, alertMessage: e.target.value }))}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setVitalOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={submitVital}
                                    className={vf.isCritical ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""}
                                    disabled={!vf.heartRate || !vf.spo2 || (vf.isCritical && !vf.alertMessage?.trim())}
                                >
                                    Save Reading
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Latest vitals strip */}
            {latest && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {[
                        { label: "HR", value: `${latest.heartRate}`, unit: "bpm", icon: <Heart className="h-4 w-4 text-red-500" />, color: "text-red-600" },
                        { label: "SpO2", value: `${latest.spo2}`, unit: "%", icon: <Wind className="h-4 w-4 text-blue-500" />, color: "text-blue-600" },
                        { label: "Temp", value: `${latest.temperature}`, unit: "°C", icon: <Thermometer className="h-4 w-4 text-orange-400" />, color: "text-orange-600" },
                        { label: "RR", value: `${latest.respiratoryRate}`, unit: "/min", icon: <Activity className="h-4 w-4 text-purple-500" />, color: "text-purple-600" },
                        { label: "SBP", value: `${latest.bloodPressureSystolic}`, unit: "mmHg", icon: <Activity className="h-4 w-4 text-emerald-500" />, color: "text-emerald-600" },
                        { label: "DBP", value: `${latest.bloodPressureDiastolic}`, unit: "mmHg", icon: <Activity className="h-4 w-4 text-teal-500" />, color: "text-teal-600" },
                    ].map(({ label, value, unit, icon, color }) => (
                        <Card key={label}>
                            <CardContent className="pt-4 pb-3 px-3 flex flex-col items-center gap-1">
                                {icon}
                                <span className={`text-xl font-bold ${color}`}>{value}</span>
                                <span className="text-[10px] text-muted-foreground">{label} ({unit})</span>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Tabs defaultValue="chart">
                <TabsList>
                    <TabsTrigger value="chart"><Activity className="h-3.5 w-3.5 mr-1.5" />Trend Chart</TabsTrigger>
                    <TabsTrigger value="log"><Heart className="h-3.5 w-3.5 mr-1.5" />Vitals Log</TabsTrigger>
                    <TabsTrigger value="io"><Droplet className="h-3.5 w-3.5 mr-1.5" />I/O Balance</TabsTrigger>
                    <TabsTrigger value="notes"><FileText className="h-3.5 w-3.5 mr-1.5" />Nursing Notes</TabsTrigger>
                </TabsList>

                {/* Trend Chart */}
                <TabsContent value="chart">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Vitals Over Time</CardTitle></CardHeader>
                        <CardContent>
                            {chartData.length < 2 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Add at least 2 readings to display a trend chart.
                                </p>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={chartData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="HR (bpm)" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                                        <Line type="monotone" dataKey="SpO2 (%)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                                        <Line type="monotone" dataKey="Temp (°C)" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                                        <Line type="monotone" dataKey="RR" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Vitals Log */}
                <TabsContent value="log">
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/40">
                                        <tr>
                                            {["Time", "HR", "SpO2", "Temp", "RR", "BP", "By", "Notes", ""].map(h => (
                                                <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vitals.map(v => (
                                            <tr key={v.id} className="border-t border-border hover:bg-muted/20 group">
                                                <td className="px-4 py-2 text-xs font-mono">{format(new Date(v.recordedAt), "dd MMM HH:mm")}</td>
                                                <td className="px-4 py-2 font-semibold text-red-600">{v.heartRate}</td>
                                                <td className="px-4 py-2 font-semibold text-blue-600">{v.spo2}%</td>
                                                <td className="px-4 py-2 text-orange-600">{v.temperature}°C</td>
                                                <td className="px-4 py-2">{v.respiratoryRate}</td>
                                                <td className="px-4 py-2">{v.bloodPressureSystolic}/{v.bloodPressureDiastolic}</td>
                                                <td className="px-4 py-2 text-muted-foreground text-xs">{v.recordedBy}</td>
                                                <td className="px-4 py-2 text-muted-foreground text-xs max-w-[150px] truncate">{v.notes ?? "—"}</td>
                                                <td className="px-4 py-2 text-right">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50/50 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setVitalToDelete(v.id)}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {vitals.length === 0 && (
                                            <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No vitals recorded yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* I/O Balance */}
                <TabsContent value="io">
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm text-muted-foreground">Total Intake</CardTitle>
                                </CardHeader>
                                <CardContent><p className="text-2xl font-bold text-emerald-600">{totalIntake} mL</p></CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm text-muted-foreground">Total Output</CardTitle>
                                </CardHeader>
                                <CardContent><p className="text-2xl font-bold text-amber-600">{totalOutput} mL</p></CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm text-muted-foreground">Balance</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className={`text-2xl font-bold ${ioBalance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                                        {ioBalance >= 0 ? "+" : ""}{ioBalance} mL
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                        <Card>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/40">
                                            <tr>
                                                {["Time", "Type", "Route", "Volume (mL)", "By", "Notes", ""].map(h => (
                                                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {io.map(e => {
                                                const isEditing = editingIoId === e.id
                                                return (
                                                    <tr key={e.id} className="border-t border-border hover:bg-muted/20 group">
                                                        <td className="px-4 py-2 text-xs font-mono">{format(new Date(e.recordedAt), "dd MMM HH:mm")}</td>
                                                        <td className="px-3 py-1.5">
                                                            {isEditing ? (
                                                                <select className="text-xs border rounded px-1 py-0.5 bg-background" value={editingIoVals.ioType} onChange={ev => setEditingIoVals(p => ({ ...p, ioType: ev.target.value as any }))}>
                                                                    <option value="INTAKE">↑ Intake</option>
                                                                    <option value="OUTPUT">↓ Output</option>
                                                                </select>
                                                            ) : (
                                                                <Badge variant={e.ioType === "INTAKE" ? "default" : "outline"} className="text-xs">
                                                                    {e.ioType === "INTAKE" ? "↑ Intake" : "↓ Output"}
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-1.5">
                                                            {isEditing ? (
                                                                <select className="text-xs border rounded px-1 py-0.5 bg-background" value={editingIoVals.route} onChange={ev => setEditingIoVals(p => ({ ...p, route: ev.target.value }))}>
                                                                    {IO_ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                                                                </select>
                                                            ) : <span className="text-muted-foreground">{e.route}</span>}
                                                        </td>
                                                        <td className="px-3 py-1.5">
                                                            {isEditing ? (
                                                                <input type="number" className="text-xs border rounded px-1.5 py-0.5 w-20 bg-background" value={editingIoVals.volumeMl} onChange={ev => setEditingIoVals(p => ({ ...p, volumeMl: ev.target.value }))} />
                                                            ) : <span className="font-semibold">{e.volumeMl}</span>}
                                                        </td>
                                                        <td className="px-4 py-2 text-muted-foreground text-xs">{e.recordedBy}</td>
                                                        <td className="px-3 py-1.5">
                                                            {isEditing ? (
                                                                <input className="text-xs border rounded px-1.5 py-0.5 w-28 bg-background" value={editingIoVals.notes} onChange={ev => setEditingIoVals(p => ({ ...p, notes: ev.target.value }))} placeholder="Notes..." />
                                                            ) : <span className="text-muted-foreground text-xs max-w-[120px] truncate block">{e.notes ?? "—"}</span>}
                                                        </td>
                                                        <td className="px-3 py-1.5 text-right">
                                                            {isEditing ? (
                                                                <span className="flex items-center justify-end gap-1">
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-600 hover:bg-emerald-50" onClick={saveIoEdit} disabled={isSavingIo}>
                                                                        {isSavingIo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingIoId(null)}>
                                                                        <XIcon className="h-3 w-3" />
                                                                    </Button>
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openIoEdit(e)}>
                                                                        <Edit2 className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50/50" onClick={() => setIoToDelete(e.id)}>
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                            {io.length === 0 && (
                                                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No I/O entries yet.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Nursing Notes */}
                <TabsContent value="notes">
                    <NotesPanel admissionId={admissionId} />
                </TabsContent>
            </Tabs>

            <AlertDialog open={!!ioToDelete} onOpenChange={(open) => !open && setIoToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete I/O Entry?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this I/O entry? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            onClick={(e) => { e.preventDefault(); handleDeleteIo(); }}
                        >
                            {isDeletingIo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Delete Entry
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!vitalToDelete} onOpenChange={(open) => !open && setVitalToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Vital Reading?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove the charted reading from the patient record. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            onClick={(e) => { e.preventDefault(); handleDeleteVital(); }}
                        >
                            {isDeletingVital ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Delete Reading
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
