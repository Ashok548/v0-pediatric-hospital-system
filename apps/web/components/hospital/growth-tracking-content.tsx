"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts"
import {
  TrendingUp, Plus, Search, Trash2, Baby, Scale, Ruler,
  ChevronDown, ChevronUp, Info, Circle,
} from "lucide-react"
import { usePatients } from "@/lib/api/patients"
import { usePatientGrowth, useAddGrowthRecord, deleteGrowthRecord } from "@/lib/api/nicu"
import type { ApiGrowthRecord, CreateGrowthRecordPayload } from "@/lib/types/nicu"
import { toast } from "sonner"

// ─── WHO Weight-for-Age Percentile Reference (boys 0-24 months) ──────────────
// 3rd / 15th / 50th / 85th / 97th percentiles (kg)
// Source: WHO Child Growth Standards 2006
const WHO_WEIGHT_BOYS = [
  { month: 0, p3: 2.5, p15: 2.9, p50: 3.3, p85: 3.9, p97: 4.3 },
  { month: 1, p3: 3.4, p15: 3.9, p50: 4.5, p85: 5.1, p97: 5.7 },
  { month: 2, p3: 4.4, p15: 5.1, p50: 5.6, p85: 6.3, p97: 7.0 },
  { month: 3, p3: 5.1, p15: 5.8, p50: 6.4, p85: 7.2, p97: 7.9 },
  { month: 4, p3: 5.6, p15: 6.3, p50: 7.0, p85: 7.8, p97: 8.7 },
  { month: 5, p3: 6.1, p15: 6.9, p50: 7.5, p85: 8.4, p97: 9.3 },
  { month: 6, p3: 6.4, p15: 7.1, p50: 7.9, p85: 8.8, p97: 9.7 },
  { month: 9, p3: 7.1, p15: 8.0, p50: 8.9, p85: 9.9, p97: 10.9 },
  { month: 12, p3: 7.7, p15: 8.6, p50: 9.6, p85: 10.8, p97: 11.8 },
  { month: 15, p3: 8.2, p15: 9.2, p50: 10.3, p85: 11.5, p97: 12.6 },
  { month: 18, p3: 8.7, p15: 9.7, p50: 10.9, p85: 12.2, p97: 13.4 },
  { month: 21, p3: 9.1, p15: 10.2, p50: 11.5, p85: 12.8, p97: 14.2 },
  { month: 24, p3: 9.7, p15: 10.8, p50: 12.2, p85: 13.6, p97: 15.0 },
]

function buildChartData(records: ApiGrowthRecord[]) {
  const patientByMonth = new Map<number, number | undefined>()
  records.forEach(r => {
    if (r.weight != null) patientByMonth.set(r.ageMonths, Number(r.weight))
  })
  const allMonths = new Set([...WHO_WEIGHT_BOYS.map(d => d.month), ...patientByMonth.keys()])
  const whoMap = new Map(WHO_WEIGHT_BOYS.map(d => [d.month, d]))
  return [...allMonths].sort((a, b) => a - b).map(m => ({
    month: m,
    ...(whoMap.get(m) ?? {}),
    patWeight: patientByMonth.get(m),
  }))
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card shadow-lg p-3 text-xs min-w-[120px]">
      <p className="font-semibold text-foreground mb-1.5">Month {label}</p>
      {payload.map((p: any) => p.value != null && (
        <div key={p.dataKey} className="flex justify-between gap-4" style={{ color: p.color }}>
          <span>{p.name}</span>
          <span className="font-bold">{Number(p.value).toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
}

function GrowthRecordsTable({ records, onDeleted }: { records: ApiGrowthRecord[]; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await deleteGrowthRecord(id)
      toast.success("Record deleted")
      onDeleted()
    } catch {
      toast.error("Failed to delete record")
    } finally { setDeleting(null) }
  }

  if (records.length === 0) return (
    <div className="flex flex-col items-center py-8 gap-2">
      <TrendingUp className="size-8 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">No growth records yet. Add the first measurement.</p>
    </div>
  )

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Date</th>
            <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Age (m)</th>
            <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Weight (kg)</th>
            <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Height (cm)</th>
            <th className="text-right px-3 py-2 font-semibold text-muted-foreground">HC (cm)</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {records.map(r => (
            <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
              <td className="px-3 py-2 text-muted-foreground">{new Date(r.recordedAt).toLocaleDateString()}</td>
              <td className="px-3 py-2 text-right font-medium">{r.ageMonths}</td>
              <td className="px-3 py-2 text-right">{r.weight != null ? Number(r.weight).toFixed(3) : "—"}</td>
              <td className="px-3 py-2 text-right">{r.height != null ? Number(r.height).toFixed(1) : "—"}</td>
              <td className="px-3 py-2 text-right">{r.headCircumference != null ? Number(r.headCircumference).toFixed(1) : "—"}</td>
              <td className="px-3 py-2">
                <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-destructive"
                  disabled={deleting === r.id} onClick={() => handleDelete(r.id)}>
                  <Trash2 className="size-3" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AddMeasurementForm({ patientId, onAdded }: { patientId: string; onAdded: () => void }) {
  const addRecord = useAddGrowthRecord()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Partial<CreateGrowthRecordPayload>>({})

  function setNum(key: keyof CreateGrowthRecordPayload, raw: string) {
    setForm(prev => ({ ...prev, [key]: raw === "" ? undefined : Number(raw) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.ageMonths == null) { toast.error("Age in months is required"); return }
    setLoading(true)
    try {
      await addRecord(patientId, { ageMonths: form.ageMonths, weight: form.weight, height: form.height, headCircumference: form.headCircumference })
      toast.success("Growth record added")
      setForm({})
      onAdded()
    } catch { toast.error("Failed to add record") }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Age (months) <span className="text-destructive">*</span></label>
        <Input className="h-9 text-sm" type="number" min={0} placeholder="e.g. 6" value={form.ageMonths ?? ""} onChange={e => setNum("ageMonths", e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Scale className="size-3" />Weight (kg)</label>
        <Input className="h-9 text-sm" type="number" step="0.001" placeholder="e.g. 7.200" value={form.weight ?? ""} onChange={e => setNum("weight", e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Ruler className="size-3" />Height (cm)</label>
        <Input className="h-9 text-sm" type="number" step="0.1" placeholder="e.g. 65.0" value={form.height ?? ""} onChange={e => setNum("height", e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Circle className="size-3" />Head Circ. (cm)</label>
        <Input className="h-9 text-sm" type="number" step="0.1" placeholder="e.g. 42.5" value={form.headCircumference ?? ""} onChange={e => setNum("headCircumference", e.target.value)} />
      </div>
      <Button type="submit" disabled={loading} className="gap-2 col-span-2 sm:col-span-4">
        <Plus className="size-4" />
        {loading ? "Saving…" : "Add Measurement"}
      </Button>
    </form>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
interface GrowthTrackingContentProps {
  patientId?: string
}

export function GrowthTrackingContent({ patientId: initialPatientId }: GrowthTrackingContentProps) {
  const [search, setSearch] = useState("")
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(initialPatientId ?? null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showRecords, setShowRecords] = useState(true)

  const { patients, isLoading: patientsLoading } = usePatients({ search, limit: 10 })
  const showDropdown = search.length > 0 && !selectedPatientId
  const { records, isLoading: recordsLoading, mutate } = usePatientGrowth(selectedPatientId)
  const selectedPatient = patients.find(p => p.id === selectedPatientId)
  const chartData = buildChartData(records)
  const hasWeightData = records.some(r => r.weight != null)

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" />
          Growth Tracking
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">WHO standard growth charts for pediatric patients</p>
      </div>

      {/* Patient Search */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search patient by name or UHID…"
                  value={selectedPatientId
                    ? `${selectedPatient?.firstName ?? ""} ${selectedPatient?.lastName ?? ""} (${selectedPatient?.uhid ?? ""})`
                    : search}
                  onChange={e => { setSearch(e.target.value); setSelectedPatientId(null) }}
                />
              </div>
              {selectedPatientId && (
                <Button variant="outline" size="sm" onClick={() => { setSelectedPatientId(null); setSearch("") }}>Clear</Button>
              )}
            </div>
            {showDropdown && (
              <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                {patientsLoading ? (
                  <div className="p-3 text-sm text-muted-foreground">Searching…</div>
                ) : patients.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">No patients found</div>
                ) : patients.map(p => (
                  <button key={p.id} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => { setSelectedPatientId(p.id); setSearch("") }}>
                    <Baby className="size-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{p.firstName} {p.lastName}</p>
                      <p className="text-xs text-muted-foreground">{p.uhid} · {new Date(p.dateOfBirth).toLocaleDateString()}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedPatientId && (
        <>
          {/* WHO Weight-for-Age Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Scale className="size-4 text-primary" />Weight-for-Age Chart
                  </CardTitle>
                  <CardDescription className="text-xs">Patient weight vs WHO percentile reference (Boys 0–24 months)</CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] gap-1"><Info className="size-3" />WHO 2006</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {recordsLoading ? <Skeleton className="h-64 w-full" /> : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                    <XAxis dataKey="month" tickFormatter={v => `${v}m`} tick={{ fontSize: 11 }} />
                    <YAxis unit=" kg" tick={{ fontSize: 11 }} width={45} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line dataKey="p97" name="97th %" stroke="#f87171" strokeDasharray="4 4" dot={false} strokeWidth={1} />
                    <Line dataKey="p85" name="85th %" stroke="#fb923c" strokeDasharray="4 4" dot={false} strokeWidth={1} />
                    <Line dataKey="p50" name="50th %" stroke="#64748b" strokeDasharray="4 4" dot={false} strokeWidth={1.5} />
                    <Line dataKey="p15" name="15th %" stroke="#fb923c" strokeDasharray="4 4" dot={false} strokeWidth={1} />
                    <Line dataKey="p3" name="3rd %" stroke="#f87171" strokeDasharray="4 4" dot={false} strokeWidth={1} />
                    {hasWeightData && (
                      <Line dataKey="patWeight" name="Patient" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: "#3b82f6", r: 4 }} connectNulls={false} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              )}
              {!recordsLoading && !hasWeightData && (
                <p className="text-xs text-muted-foreground text-center mt-1">Add weight measurements below to plot on the chart</p>
              )}
            </CardContent>
          </Card>

          {/* Add Measurement */}
          <Card>
            <CardHeader className="pb-2 cursor-pointer" onClick={() => setShowAddForm(v => !v)}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><Plus className="size-4 text-primary" />Add Measurement</CardTitle>
                {showAddForm ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
              </div>
            </CardHeader>
            {showAddForm && (
              <CardContent className="pt-0">
                <AddMeasurementForm patientId={selectedPatientId} onAdded={() => { mutate(); setShowAddForm(false) }} />
              </CardContent>
            )}
          </Card>

          {/* Records Table */}
          <Card>
            <CardHeader className="pb-2 cursor-pointer" onClick={() => setShowRecords(v => !v)}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" />Measurement History
                  <Badge variant="secondary" className="text-[10px]">{records.length}</Badge>
                </CardTitle>
                {showRecords ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
              </div>
            </CardHeader>
            {showRecords && (
              <CardContent className="pt-0">
                {recordsLoading ? <Skeleton className="h-32 w-full" /> : (
                  <GrowthRecordsTable records={records} onDeleted={mutate} />
                )}
              </CardContent>
            )}
          </Card>
        </>
      )}

      {!selectedPatientId && !search && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Baby className="size-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">Select a Patient</p>
            <p className="text-sm text-muted-foreground mt-1">Search for a patient above to view or add growth measurements</p>
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground border-t border-border pt-3">
        Reference: WHO Child Growth Standards (2006) · Data stored per patient via API
      </p>
    </div>
  )
}
