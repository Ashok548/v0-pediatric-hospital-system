"use client"

import { useState } from "react"
import { useVitalsStore } from "@/lib/store/vitals-store"
import { useAdmissionStore } from "@/lib/store/admission-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from "@/components/ui/dialog"
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import { format } from "date-fns"
import { Activity, Droplet, Heart, Plus, Thermometer, Wind, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { IORoute } from "@/lib/data/vitals"
import { toast } from "sonner"

const IO_ROUTES: IORoute[] = ["Oral", "IV Fluid", "NG Tube", "Urine", "NG Aspirate", "Drain", "Other"]

interface Props { admissionId: string }

export function VitalsChartContent({ admissionId }: Props) {
    const { vitals, io, totalIntake, totalOutput, ioBalance, addVitalReading, addIOEntry } = useVitalsStore(admissionId)
    const { getAdmissionById } = useAdmissionStore()
    const adm = getAdmissionById(admissionId)

    const [vitalOpen, setVitalOpen] = useState(false)
    const [ioOpen, setIoOpen] = useState(false)

    // ── Vital form state ──────────────────────────────────────────────────────
    const [vf, setVf] = useState({ heartRate: "", spo2: "", temperature: "", respRate: "", bpSystolic: "", bpDiastolic: "", recordedBy: "", notes: "" })

    // ── I/O form state ─────────────────────────────────────────────────────────
    const [iof, setIof] = useState({ ioType: "intake", route: "IV Fluid", volumeMl: "", recordedBy: "", notes: "" })

    const chartData = vitals.map(v => ({
        time: format(new Date(v.timestamp), "HH:mm"),
        "HR (bpm)": v.heartRate,
        "SpO2 (%)": v.spo2,
        "Temp (°C)": v.temperature,
        "RR": v.respRate,
    }))

    function submitVital() {
        const r = {
            heartRate: Number(vf.heartRate), spo2: Number(vf.spo2),
            temperature: Number(vf.temperature), respRate: Number(vf.respRate),
            bpSystolic: Number(vf.bpSystolic), bpDiastolic: Number(vf.bpDiastolic),
            recordedBy: vf.recordedBy || "Nurse",
            notes: vf.notes || undefined,
            timestamp: new Date().toISOString(),
        }
        addVitalReading(adm?.patientId ?? "", r)
        setVf({ heartRate: "", spo2: "", temperature: "", respRate: "", bpSystolic: "", bpDiastolic: "", recordedBy: "", notes: "" })
        setVitalOpen(false)
        toast.success("Vital reading recorded")
    }

    function submitIO() {
        const e = {
            ioType: iof.ioType as "intake" | "output",
            route: iof.route as IORoute,
            volumeMl: Number(iof.volumeMl),
            recordedBy: iof.recordedBy || "Nurse",
            notes: iof.notes || undefined,
            timestamp: new Date().toISOString(),
        }
        addIOEntry(adm?.patientId ?? "", e)
        setIof({ ioType: "intake", route: "IV Fluid", volumeMl: "", recordedBy: "", notes: "" })
        setIoOpen(false)
        toast.success("I/O entry recorded")
    }

    const latest = vitals[vitals.length - 1]

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
                        Vitals & I/O — {adm?.patientName ?? admissionId}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {adm?.patientId} · {adm?.currentLocation?.wardName} / <strong>{adm?.currentLocation?.bedNumber}</strong>
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
                                        <Select value={iof.ioType} onValueChange={v => setIof(p => ({ ...p, ioType: v }))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="intake">Intake</SelectItem>
                                                <SelectItem value="output">Output</SelectItem>
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
                                <div className="space-y-1">
                                    <Label>Recorded By</Label>
                                    <Input value={iof.recordedBy} onChange={e => setIof(p => ({ ...p, recordedBy: e.target.value }))} placeholder="Nurse name" />
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
                                    { label: "Resp. Rate (/min)", key: "respRate", placeholder: "24" },
                                    { label: "BP Systolic", key: "bpSystolic", placeholder: "100" },
                                    { label: "BP Diastolic", key: "bpDiastolic", placeholder: "65" },
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
                                    <Label>Recorded By</Label>
                                    <Input value={vf.recordedBy} onChange={e => setVf(p => ({ ...p, recordedBy: e.target.value }))} placeholder="Nurse name" />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label>Notes (optional)</Label>
                                    <Textarea value={vf.notes} onChange={e => setVf(p => ({ ...p, notes: e.target.value }))} rows={2} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setVitalOpen(false)}>Cancel</Button>
                                <Button onClick={submitVital} disabled={!vf.heartRate || !vf.spo2}>Save Reading</Button>
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
                        { label: "RR", value: `${latest.respRate}`, unit: "/min", icon: <Activity className="h-4 w-4 text-purple-500" />, color: "text-purple-600" },
                        { label: "SBP", value: `${latest.bpSystolic}`, unit: "mmHg", icon: <Activity className="h-4 w-4 text-emerald-500" />, color: "text-emerald-600" },
                        { label: "DBP", value: `${latest.bpDiastolic}`, unit: "mmHg", icon: <Activity className="h-4 w-4 text-teal-500" />, color: "text-teal-600" },
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
                    <TabsTrigger value="log">Vitals Log</TabsTrigger>
                    <TabsTrigger value="io"><Droplet className="h-3.5 w-3.5 mr-1.5" />I/O Balance</TabsTrigger>
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
                                            {["Time", "HR", "SpO2", "Temp", "RR", "BP", "By", "Notes"].map(h => (
                                                <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...vitals].reverse().map(v => (
                                            <tr key={v.id} className="border-t border-border hover:bg-muted/20">
                                                <td className="px-4 py-2 text-xs font-mono">{format(new Date(v.timestamp), "dd MMM HH:mm")}</td>
                                                <td className="px-4 py-2 font-semibold text-red-600">{v.heartRate}</td>
                                                <td className="px-4 py-2 font-semibold text-blue-600">{v.spo2}%</td>
                                                <td className="px-4 py-2 text-orange-600">{v.temperature}°C</td>
                                                <td className="px-4 py-2">{v.respRate}</td>
                                                <td className="px-4 py-2">{v.bpSystolic}/{v.bpDiastolic}</td>
                                                <td className="px-4 py-2 text-muted-foreground text-xs">{v.recordedBy}</td>
                                                <td className="px-4 py-2 text-muted-foreground text-xs max-w-[180px] truncate">{v.notes ?? "—"}</td>
                                            </tr>
                                        ))}
                                        {vitals.length === 0 && (
                                            <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No vitals recorded yet.</td></tr>
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
                                                {["Time", "Type", "Route", "Volume (mL)", "By", "Notes"].map(h => (
                                                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...io].reverse().map(e => (
                                                <tr key={e.id} className="border-t border-border hover:bg-muted/20">
                                                    <td className="px-4 py-2 text-xs font-mono">{format(new Date(e.timestamp), "dd MMM HH:mm")}</td>
                                                    <td className="px-4 py-2">
                                                        <Badge variant={e.ioType === "intake" ? "default" : "outline"} className="text-xs">
                                                            {e.ioType === "intake" ? "↑ Intake" : "↓ Output"}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-2 text-muted-foreground">{e.route}</td>
                                                    <td className="px-4 py-2 font-semibold">{e.volumeMl}</td>
                                                    <td className="px-4 py-2 text-muted-foreground text-xs">{e.recordedBy}</td>
                                                    <td className="px-4 py-2 text-muted-foreground text-xs">{e.notes ?? "—"}</td>
                                                </tr>
                                            ))}
                                            {io.length === 0 && (
                                                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No I/O entries yet.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
