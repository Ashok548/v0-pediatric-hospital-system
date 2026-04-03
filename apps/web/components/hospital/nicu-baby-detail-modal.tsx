"use client"

import React, { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { DoctorDictationEditor } from "@/components/DoctorDictationEditor"
import {
  Activity, Clock, Thermometer, Droplets, Wind, HeartPulse,
  Baby, AlertTriangle, ArrowRight, ShieldAlert, FileText,
    FileEdit, Plus, Info, Scale, Syringe, Trash2, XCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"

// Types & Hooks
import type { ApiNicuAdmission, CreateVitalsPayload } from "@/lib/types/nicu"
import { deriveNicuStatus, getVitalLevel } from "@/lib/utils/vitals"
import { usePatient } from "@/lib/api/patients"
import { useAdmissionVitals, useRecordVitals, deleteVitals } from "@/lib/api/nicu"
import { useAdmissionLabOrders } from "@/lib/api/labs"
import { useAdmissionServiceOrders } from "@/lib/api/service-orders"
import { usePrescriptions } from "@/lib/api/pharmacy"
import { useIoRecords, useCreateIoRecord, useDeleteIoRecord, useNursingNotes, useCreateNursingNote, useDeleteNursingNote } from "@/lib/api/nursing"

// Dialogs
import { CreateLabOrderDialog } from "./dialogs/create-lab-order-dialog"
import { CreateServiceOrderDialog } from "./dialogs/create-service-order-dialog"
import { CreateMedicationOrderDialog } from "./dialogs/create-medication-order-dialog"

// ─── Inline Components ────────────────────────────────────────────────────────

function VitalsForm({ admissionId, onSuccess }: { admissionId: string; onSuccess: () => void }) {
  const recordVitals = useRecordVitals()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Partial<CreateVitalsPayload>>({})

  function setField(key: keyof CreateVitalsPayload, raw: string) {
    const num = raw === "" ? undefined : Number(raw)
    setForm(prev => ({ ...prev, [key]: num }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: Partial<CreateVitalsPayload> = {}
    if (form.heartRate != null) payload.heartRate = form.heartRate
    if (form.spo2 != null) payload.spo2 = form.spo2
    if (form.temperature != null) payload.temperature = form.temperature
    if (form.respiratoryRate != null) payload.respiratoryRate = form.respiratoryRate
    if (form.bloodPressureSystolic != null) payload.bloodPressureSystolic = form.bloodPressureSystolic
    if (form.bloodPressureDiastolic != null) payload.bloodPressureDiastolic = form.bloodPressureDiastolic
    if (form.weight != null) payload.weight = form.weight

    if (Object.keys(payload).length === 0) {
      toast.error("Enter at least one vitals value")
      return
    }
    setLoading(true)
    try {
      await recordVitals(admissionId, payload as CreateVitalsPayload)
      toast.success("Vitals recorded successfully")
      setForm({})
      onSuccess()
    } catch {
      toast.error("Failed to record vitals")
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "h-9 text-sm"
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><HeartPulse className="size-3.5" />Heart Rate (bpm)</label>
          <Input className={inputCls} type="number" placeholder="e.g. 145" value={form.heartRate ?? ""} onChange={e => setField("heartRate", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Droplets className="size-3.5" />SpO₂ (%)</label>
          <Input className={inputCls} type="number" placeholder="e.g. 96" value={form.spo2 ?? ""} onChange={e => setField("spo2", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Thermometer className="size-3.5" />Temperature (°C)</label>
          <Input className={inputCls} type="number" step="0.1" placeholder="e.g. 36.8" value={form.temperature ?? ""} onChange={e => setField("temperature", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Wind className="size-3.5" />Resp. Rate (/min)</label>
          <Input className={inputCls} type="number" placeholder="e.g. 42" value={form.respiratoryRate ?? ""} onChange={e => setField("respiratoryRate", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">BP Systolic</label>
          <Input className={inputCls} type="number" placeholder="e.g. 90" value={form.bloodPressureSystolic ?? ""} onChange={e => setField("bloodPressureSystolic", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">BP Diastolic</label>
          <Input className={inputCls} type="number" placeholder="e.g. 60" value={form.bloodPressureDiastolic ?? ""} onChange={e => setField("bloodPressureDiastolic", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5 col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Weight (kg)</label>
          <Input className={inputCls} type="number" step="0.001" placeholder="e.g. 1.820" value={form.weight ?? ""} onChange={e => setField("weight", e.target.value)} />
        </div>
      </div>
      <Button type="submit" disabled={loading} className="w-full gap-2">
        <Activity className="size-4" />
        {loading ? "Saving…" : "Record Vitals"}
      </Button>
    </form>
  )
}

function OrdersTab({ admission }: { admission: ApiNicuAdmission }) {
  const patientId = admission.patient.id;
  const { orders: labOrders, isLoading: labsLoading, mutate: mutateLabOrders } = useAdmissionLabOrders(admission.id)
  const { orders: serviceOrders, isLoading: servicesLoading, mutate: mutateServiceOrders } = useAdmissionServiceOrders(admission.id)
  const { prescriptions, isLoading: rxLoading } = usePrescriptions({ admissionId: admission.id })

  const allOrders = [
    ...(labOrders?.map((o: any) => ({ ...o, _type: 'LAB', date: new Date(o.orderDate) })) || []),
    ...(serviceOrders?.map((o: any) => ({ ...o, _type: 'SERVICE', date: new Date(o.orderDate) })) || []),
    ...(prescriptions?.map((o: any) => ({ ...o, _type: 'RX', date: new Date(o.orderedAt) })) || [])
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  const pendingCount = allOrders.filter(o => o.status === 'PENDING').length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2 p-3 bg-muted/40 rounded-lg border">
         <CreateLabOrderDialog patientId={patientId} admissionId={admission.id} onSuccess={() => mutateLabOrders()} trigger={<Button size="sm" variant="outline" className="w-full bg-background"><Plus className="size-4 mr-2" /> 🧪 Lab Test</Button>} />
         <CreateMedicationOrderDialog patientId={patientId} admissionId={admission.id} trigger={<Button size="sm" variant="outline" className="w-full bg-background"><Plus className="size-4 mr-2" /> 💊 Medication</Button>} />
         <CreateServiceOrderDialog patientId={patientId} admissionId={admission.id} onSuccess={() => mutateServiceOrders()} trigger={<Button size="sm" variant="outline" className="w-full bg-background"><Plus className="size-4 mr-2" /> ⚕️ Service</Button>} />
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Recent Orders</h3>
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">{pendingCount} Pending</Badge>
        </div>
        
        {labsLoading || servicesLoading || rxLoading ? (
            <div className="flex flex-col gap-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
        ) : allOrders.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center border border-dashed rounded-lg bg-card">
              <p className="text-sm text-muted-foreground">No recent orders found.</p>
            </div>
        ) : (
            <div className="flex flex-col gap-2">
                {allOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg bg-card text-sm">
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-[10px] w-14 justify-center shrink-0">
                                {order._type === 'LAB' ? '🧪 LAB' : order._type === 'SERVICE' ? '⚕️ SRV' : '💊 RX'}
                            </Badge>
                            <div className="flex flex-col overflow-hidden">
                                <span className="font-medium truncate max-w-[200px] sm:max-w-xs">
                                {order._type === 'LAB' ? order.panels?.map((p: any) => p.panelName).join(', ') : 
                                order._type === 'SERVICE' ? order.service?.name : 
                                order.items?.map((i: any) => i.medication.drugName).join(', ')}
                                </span>
                                <span className="text-[11px] text-muted-foreground">{order.orderNumber || order.prescriptionNumber} • {order.date.toLocaleDateString()}</span>
                            </div>
                        </div>
                        <Badge variant={order.status === 'PENDING' ? 'outline' : 'secondary'} className={cn("text-[10px] whitespace-nowrap", order.status === 'PENDING' && "border-warning/50 text-warning-foreground bg-warning/10")}>
                            {order.status}
                        </Badge>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Modal Component ─────────────────────────────────────────────────────

export function NicuBabyDetailModal({ admission, onClose }: { admission: ApiNicuAdmission; onClose: () => void }) {
  const router = useRouter()
    const { role } = useAuth()
    const canInitiateDischarge = role === "DOCTOR" || role === "ADMIN"
  // Data hooks
  const { patient, isLoading: patientLoading } = usePatient(admission.patient.id)
  const { vitals, isLoading: vitalsLoading, mutate: mutateVitals } = useAdmissionVitals(admission.id)
  const { records: ioRecords, mutate: mutateIo } = useIoRecords(admission.id)
  const { notes, mutate: mutateNotes } = useNursingNotes(admission.id)
  
  // Actions
  const createIo = useCreateIoRecord()
  const deleteIo = useDeleteIoRecord()
  const createNote = useCreateNursingNote()
  const deleteNote = useDeleteNursingNote()

  // State
  const [activeTab, setActiveTab] = useState<"overview" | "vitals" | "io" | "notes" | "orders">("overview")
  const [isDeletingRest, setIsDeletingRest] = useState(false)
  const [showVitalsForm, setShowVitalsForm] = useState(false)

  // Sub-forms state
  const [ioForm, setIoForm] = useState<{ type: "INTAKE" | "OUTPUT", route: string, volumeMl: string, notes: string }>({ type: "INTAKE", route: "ORAL", volumeMl: "", notes: "" })
  const [noteForm, setNoteForm] = useState<{ type: string, priority: "NORMAL" | "URGENT" | "CRITICAL", content: string }>({ type: "PROGRESS", priority: "NORMAL", content: "" })

  const status = deriveNicuStatus(vitals?.[0] ?? null, admission.nicuRiskLevel)
  const statusColor = { stable: "text-success bg-success/10 border-success/20", warning: "text-warning-foreground bg-warning/10 border-warning/30", critical: "text-destructive bg-destructive/10 border-destructive/30" }
  const los = Math.max(0, Math.floor((Date.now() - new Date(admission.admissionDate).getTime()) / 86_400_000))
  const ageMonths = patient ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0
  
  // I/O Calculus
  const last24hIo = ioRecords.filter(r => new Date(r.recordedAt).getTime() > Date.now() - 86400000)
  const totalIntake = last24hIo.filter(r => r.ioType === "INTAKE").reduce((acc, r) => acc + r.volumeMl, 0)
  const totalOutput = last24hIo.filter(r => r.ioType === "OUTPUT").reduce((acc, r) => acc + r.volumeMl, 0)
  const balance = totalIntake - totalOutput

  return (
    <div className="flex flex-col h-full bg-background rounded-b-lg">
      
      {/* ─── Rich Identity Header ─── */}
      <div className="flex flex-col gap-3 p-5 border-b bg-card">
        <div className="flex justify-between items-start gap-4">
            <div className="flex items-start gap-4">
                {/* Avatar / Status Ring */}
                <div className={cn("flex items-center justify-center size-14 rounded-full border-4 shrink-0 shadow-sm", 
                    status === "critical" ? "border-destructive/30 bg-destructive/5" : 
                    status === "warning" ? "border-warning/30 bg-warning/5" : "border-success/30 bg-success/5")}>
                    <Baby className={cn("size-7", 
                        status === "critical" ? "text-destructive" : 
                        status === "warning" ? "text-warning-foreground" : "text-success")} />
                </div>
                
                {/* Identity Box */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold leading-none">{admission.patient.firstName} {admission.patient.lastName}</h2>
                        <Badge variant="outline" className="font-mono text-xs">{admission.patient.uhid}</Badge>
                        <Badge variant="secondary" className={cn("text-[10px] uppercase font-bold tracking-widest", statusColor[status])}>
                            ● {status}
                        </Badge>
                    </div>
                    {patientLoading ? <Skeleton className="h-4 w-64 mt-1" /> : patient ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{new Date(patient.dateOfBirth).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{ageMonths} months</span>
                            <span>•</span>
                            <span className="capitalize">{patient.gender.toLowerCase()}</span>
                            {patient.bloodGroup && (
                                <><span>•</span><span className="text-destructive font-bold">{patient.bloodGroup}</span></>
                            )}
                            {patient.birthWeight && (
                                <><span>•</span><span>BW: {patient.birthWeight}kg</span></>
                            )}
                        </div>
                    ) : null}
                    
                    {patient && (
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                            <span>Grd: <span className="font-medium text-foreground">{patient.guardianName}</span></span>
                            {patient.guardianRelationship && <span className="italic">({patient.guardianRelationship})</span>}
                            {patient.guardianPhone && <span>• 📞 {patient.guardianPhone}</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* Context Box */}
            <div className="flex flex-col items-end text-right shrink-0">
                <div className="flex flex-col items-end p-2 bg-muted/40 rounded-lg border">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">NICU · Day {los}</span>
                    <span className="text-sm font-semibold">{admission.department}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">Bed: <span className="font-bold text-foreground">{admission.currentBed?.bedNumber || "Unassigned"}</span></span>
                </div>
            </div>
        </div>

        {/* Diagnosis & Allergy Banner */}
        <div className="flex flex-col gap-2 mt-2">
            {admission.initialDiagnosis && (
                <div className="flex items-center gap-3 text-xs bg-muted/30 px-3 py-2 rounded-md border border-border/50">
                    <FileText className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate"><span className="font-bold mr-1">Dx:</span> {admission.initialDiagnosis}</span>
                    <div className="flex gap-2 shrink-0">
                        {admission.gestationalAge && <Badge variant="outline" className="bg-background text-[10px]">GA: {admission.gestationalAge}</Badge>}
                        {admission.nicuRiskLevel && <Badge variant="outline" className="bg-background text-[10px]">Risk: {admission.nicuRiskLevel}</Badge>}
                        <Badge variant="outline" className={cn("bg-background text-[10px]", 
                            admission.priority === "CRITICAL" && "border-destructive text-destructive")}>Prior: {admission.priority}</Badge>
                    </div>
                </div>
            )}
            {patient?.allergies && patient.allergies.length > 0 && (
                <div className="flex items-center gap-2 text-xs bg-destructive/10 text-destructive px-3 py-2 rounded-md border border-destructive/20 font-medium">
                    <ShieldAlert className="size-4 shrink-0" />
                    <span>Allergies: {patient.allergies.join(", ")}</span>
                </div>
            )}
        </div>
      </div>

      {/* ─── Tabs Navigation ─── */}
      <div className="px-5 pt-4 bg-muted/10 border-b">
        <div className="flex gap-4">
          {(["overview", "vitals", "io", "orders", "notes"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn("px-1 pb-3 text-sm font-semibold capitalize border-b-2 transition-colors",
                activeTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border")}>
              {tab === "overview" ? "Overview" : tab === "vitals" ? "Vitals" : tab === "io" ? "I/O Balance" : tab === "notes" ? "Notes" : "Orders"}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tab Content (Scrollable) ─── */}
      <div className="flex-1 overflow-y-auto p-5 relative min-h-[350px]">
          
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-5">
              
              {/* Latest Vitals Strip */}
              <div className="flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><Activity className="size-3.5" /> Live Vitals</h3>
                    {vitals && vitals.length > 0 && <span className="text-[10px] text-muted-foreground">Updated {new Date(vitals[0].recordedAt).toLocaleTimeString()}</span>}
                </div>
                <div className="p-4">
                  {vitalsLoading ? <Skeleton className="h-12 w-full" /> : vitals && vitals.length > 0 ? (
                      <div className="flex flex-wrap gap-x-6 gap-y-3">
                        {vitals[0].heartRate != null && <VitalBadge label="HR" val={`${vitals[0].heartRate} bpm`} level={getVitalLevel("heartRate", vitals[0].heartRate)} />}
                        {vitals[0].spo2 != null && <VitalBadge label="SpO₂" val={`${vitals[0].spo2}%`} level={getVitalLevel("spo2", vitals[0].spo2)} />}
                        {vitals[0].temperature != null && <VitalBadge label="Temp" val={`${Number(vitals[0].temperature).toFixed(1)}°C`} level={getVitalLevel("temperature", Number(vitals[0].temperature))} />}
                        {vitals[0].respiratoryRate != null && <VitalBadge label="RR" val={`${vitals[0].respiratoryRate}`} level={getVitalLevel("respiratoryRate", vitals[0].respiratoryRate)} />}
                        {vitals[0].weight != null && <VitalBadge label="Weight" val={`${vitals[0].weight} kg`} level="normal" />}
                      </div>
                  ) : <span className="text-sm text-muted-foreground">No vitals recorded yet.</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* I/O Summary */}
                  <div className="col-span-2 lg:col-span-2 flex flex-col rounded-xl border bg-card p-4">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5"><Scale className="size-3.5" /> 24h I/O Balance</h3>
                      <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                              <span className="text-[10px] text-muted-foreground">Intake</span>
                              <span className="font-bold text-success text-sm">+{totalIntake} mL</span>
                          </div>
                          <div className="h-8 w-px bg-border"></div>
                          <div className="flex flex-col">
                              <span className="text-[10px] text-muted-foreground">Output</span>
                              <span className="font-bold text-warning-foreground text-sm">-{totalOutput} mL</span>
                          </div>
                          <div className="h-8 w-px bg-border"></div>
                          <div className="flex flex-col items-end">
                              <span className="text-[10px] text-muted-foreground">Balance</span>
                              <span className={cn("font-extrabold text-base", balance > 0 ? "text-success" : balance < 0 ? "text-warning-foreground" : "text-foreground")}>
                                  {balance > 0 ? "+" : ""}{balance} mL
                              </span>
                          </div>
                      </div>
                  </div>
                  
                  {/* Admission Meta */}
                  <div className="col-span-2 lg:col-span-2 flex flex-col gap-2 rounded-xl border bg-card p-4 text-sm justify-center">
                      <div className="flex justify-between items-center"><span className="text-muted-foreground text-xs">Admission #</span><span className="font-mono text-xs">{admission.admissionNumber}</span></div>
                      <div className="flex justify-between items-center"><span className="text-muted-foreground text-xs">Admitted On</span><span className="text-xs font-medium">{new Date(admission.admissionDate).toLocaleDateString()}</span></div>
                      <div className="flex justify-between items-center"><span className="text-muted-foreground text-xs">Attending</span><span className="text-xs font-medium">{admission.admittingDoctor ? `Dr. ${admission.admittingDoctor.name}` : "—"}</span></div>
                  </div>
              </div>

            </div>
          )}

          {/* VITALS TAB */}
          {activeTab === "vitals" && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-sm">Vitals History</h3>
                  <Button size="sm" variant={showVitalsForm ? "secondary" : "default"} onClick={() => setShowVitalsForm(!showVitalsForm)}>
                      {showVitalsForm ? "Close Form" : <><Plus className="size-4 mr-1.5" /> Record Vitals</>}
                  </Button>
              </div>

              {showVitalsForm && (
                  <div className="border bg-muted/20 p-4 rounded-xl border-primary/20 animate-in fade-in slide-in-from-top-2">
                    <h3 className="font-semibold text-sm mb-3">Record New Vitals</h3>
                    <VitalsForm admissionId={admission.id} onSuccess={() => { mutateVitals(); setShowVitalsForm(false) }} />
                  </div>
              )}

              <div className="rounded-xl border bg-card overflow-hidden mt-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="text-[10px] uppercase bg-muted/50 text-muted-foreground border-b border-border/60">
                            <tr>
                                <th className="px-4 py-2.5 font-semibold">Time</th>
                                <th className="px-4 py-2.5 font-semibold">HR</th>
                                <th className="px-4 py-2.5 font-semibold">SpO₂</th>
                                <th className="px-4 py-2.5 font-semibold">Temp</th>
                                <th className="px-4 py-2.5 font-semibold">RR</th>
                                <th className="px-4 py-2.5 font-semibold">BP</th>
                                <th className="px-4 py-2.5 font-semibold">Wt</th>
                                <th className="px-4 py-2.5 font-semibold text-right">Act</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {vitalsLoading ? (
                                <tr><td colSpan={8} className="p-4"><Skeleton className="h-8 w-full" /></td></tr>
                            ) : vitals.length === 0 ? (
                                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No vitals recorded</td></tr>
                            ) : vitals.map(v => {
                                const ts = deriveNicuStatus(v, null)
                                const temperatureLevel = v.temperature != null
                                    ? getVitalLevel("temperature", Number(v.temperature))
                                    : "normal"
                                const respiratoryLevel = v.respiratoryRate != null
                                    ? getVitalLevel("respiratoryRate", v.respiratoryRate)
                                    : "normal"
                                return (
                                    <tr key={v.id} className={cn("hover:bg-muted/30 transition-colors", v.isCritical && "bg-destructive/5")}>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex flex-col">
                                            <span className="font-medium">{new Date(v.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className="text-[10px] text-muted-foreground">{new Date(v.recordedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3"><VitalTxt val={v.heartRate} lvl={getVitalLevel("heartRate", v.heartRate)} /></td>
                                        <td className="px-4 py-3"><VitalTxt val={v.spo2} lvl={getVitalLevel("spo2", v.spo2)} sfx="%" /></td>
                                        <td className="px-4 py-3"><VitalTxt val={v.temperature != null ? Number(v.temperature).toFixed(1) : null} lvl={temperatureLevel} sfx="°" /></td>
                                        <td className="px-4 py-3"><VitalTxt val={v.respiratoryRate} lvl={respiratoryLevel} /></td>
                                        <td className="px-4 py-3">{v.bloodPressureSystolic ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}` : "—"}</td>
                                        <td className="px-4 py-3">{v.weight ? `${v.weight}kg` : "—"}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-destructive" onClick={async () => {
                                                if(confirm("Delete reading?")) { await deleteVitals(v.id); mutateVitals() }
                                            }}><Trash2 className="size-3" /></Button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                  </div>
              </div>
            </div>
          )}

          {/* I/O BALANCE TAB */}
          {activeTab === "io" && (
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-3 gap-0 rounded-xl border overflow-hidden shadow-sm">
                    <div className="flex flex-col items-center justify-center p-4 bg-background">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Total Intake</span>
                        <span className="text-2xl font-black text-success">+{totalIntake} <span className="text-sm font-medium">mL</span></span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-background border-x">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Total Output</span>
                        <span className="text-2xl font-black text-warning-foreground">-{totalOutput} <span className="text-sm font-medium">mL</span></span>
                    </div>
                    <div className={cn("flex flex-col items-center justify-center p-4 text-primary-foreground", balance > 0 ? "bg-success" : balance < 0 ? "bg-destructive" : "bg-primary")}>
                        <span className="text-[10px] uppercase font-bold tracking-widest mb-1 opacity-80">Net Balance</span>
                        <span className="text-3xl font-black">{balance > 0 ? "+" : ""}{balance} <span className="text-sm font-medium">mL</span></span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    
                    {/* Record Form */}
                    <div className="md:col-span-1 rounded-xl border bg-card p-4 sticky top-0">
                        <h3 className="text-sm font-semibold mb-3 border-b pb-2">Record I/O</h3>
                        <form className="flex flex-col gap-3" onSubmit={async (e) => {
                            e.preventDefault()
                            if (!ioForm.volumeMl) return toast.error("Volume required")
                            setIsDeletingRest(true)
                            try {
                                await createIo(admission.id, { 
                                    ioType: ioForm.type, 
                                    route: ioForm.route, 
                                    volumeMl: Number(ioForm.volumeMl), 
                                    notes: ioForm.notes 
                                })
                                toast.success("I/O recorded")
                                setIoForm({ ...ioForm, volumeMl: "", notes: "" })
                                mutateIo()
                            } catch (e: any) { toast.error(e.message) }
                            finally { setIsDeletingRest(false) }
                        }}>
                            <div className="flex gap-1.5 p-1 bg-muted rounded-lg">
                                <button type="button" onClick={() => setIoForm({...ioForm, type: "INTAKE"})} className={cn("flex-1 text-xs py-1.5 rounded-md font-medium transition", ioForm.type === "INTAKE" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>Intake</button>
                                <button type="button" onClick={() => setIoForm({...ioForm, type: "OUTPUT"})} className={cn("flex-1 text-xs py-1.5 rounded-md font-medium transition", ioForm.type === "OUTPUT" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>Output</button>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Route / Source</label>
                                <Input className="h-8 text-xs" value={ioForm.route} onChange={e => setIoForm({...ioForm, route: e.target.value})} placeholder={ioForm.type === "INTAKE" ? "e.g. Oral, IV Fluid, NG Feed" : "e.g. Urine, Stool, Drain"} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Volume (mL)</label>
                                <Input className="h-8 text-xs font-mono" type="number" value={ioForm.volumeMl} onChange={e => setIoForm({...ioForm, volumeMl: e.target.value})} placeholder="0" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Notes (Optional)</label>
                                <Input className="h-8 text-xs" value={ioForm.notes} onChange={e => setIoForm({...ioForm, notes: e.target.value})} placeholder="..." />
                            </div>
                            <Button size="sm" type="submit" className="w-full mt-1" disabled={isDeletingRest}>Add Record</Button>
                        </form>
                    </div>

                    {/* Ledger List */}
                    <div className="md:col-span-2 flex flex-col gap-2">
                        <h3 className="text-sm font-semibold mb-1">Recent Ledger</h3>
                        {ioRecords.length === 0 ? (
                            <div className="border border-dashed rounded-xl p-8 text-center text-muted-foreground text-sm">No I/O records found.</div>
                        ) : ioRecords.map(r => (
                            <div key={r.id} className="flex items-center justify-between p-3 border rounded-xl bg-card hover:bg-muted/10 transition">
                                <div className="flex items-end gap-3">
                                    <div className={cn("flex items-center justify-center size-9 rounded-full shrink-0", r.ioType === "INTAKE" ? "bg-success/10 text-success" : "bg-warning/10 text-warning-foreground")}>
                                        <Syringe className="size-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex gap-2 items-center">
                                            <span className="font-semibold text-sm">{r.route}</span>
                                            {r.notes && <span className="text-[10px] text-muted-foreground italic truncate max-w-[150px]">— {r.notes}</span>}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="size-3" />{new Date(r.recordedAt).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={cn("font-bold font-mono tracking-tight", r.ioType === "INTAKE" ? "text-success" : "text-warning-foreground")}>
                                        {r.ioType === "INTAKE" ? "+" : "-"}{r.volumeMl} <span className="text-xs font-medium text-muted-foreground">mL</span>
                                    </span>
                                    <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={async () => {
                                        if(confirm("Delete record?")) { await deleteIo(r.id, admission.id); mutateIo() }
                                    }}><Trash2 className="size-3.5" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
          )}

          {/* NURSING NOTES TAB */}
          {activeTab === "notes" && (
            <div className="flex flex-col md:flex-row gap-6 items-start h-full">
                
                {/* Form Side */}
                <div className="w-full md:w-1/3 rounded-xl border bg-card p-4 sticky top-0 flex flex-col gap-4">
                    <h3 className="text-sm font-semibold border-b pb-2">Add Clinical Note</h3>
                    <form className="flex flex-col gap-3" onSubmit={async (e) => {
                        e.preventDefault()
                        if (!noteForm.content) return toast.error("Content required")
                        setIsDeletingRest(true)
                        try {
                            await createNote(admission.id, {
                                noteType: noteForm.type,
                                priority: noteForm.priority,
                                content: noteForm.content
                            })
                            toast.success("Note added")
                            setNoteForm({ type: "PROGRESS", priority: "NORMAL", content: "" })
                            mutateNotes()
                        } catch (e: any) { toast.error(e.message) }
                        finally { setIsDeletingRest(false) }
                    }}>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Type</label>
                            <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm"
                                value={noteForm.type} onChange={e => setNoteForm({...noteForm, type: e.target.value})}>
                                <option value="PROGRESS">Progress</option>
                                <option value="OBSERVATION">Observation</option>
                                <option value="HANDOVER">Shift Handover</option>
                                <option value="MEDICATION">Medication Event</option>
                                <option value="CRITICAL">Critical Event</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Severity</label>
                            <div className="flex gap-1.5">
                                {["NORMAL", "URGENT", "CRITICAL"].map(p => (
                                    <button key={p} type="button" onClick={() => setNoteForm({...noteForm, priority: p as any})} 
                                        className={cn("flex-1 text-[10px] py-1 rounded-md font-bold transition border", 
                                        noteForm.priority === p ? (p === "CRITICAL" ? "bg-destructive text-destructive-foreground border-destructive" : p === "URGENT" ? "bg-warning text-warning-foreground border-warning" : "bg-primary text-primary-foreground border-primary") : "bg-transparent text-muted-foreground hover:bg-muted")}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Content</label>
                            <DoctorDictationEditor
                                value={noteForm.content}
                                disabled={isDeletingRest}
                                placeholder="Enter clinical notes..."
                                onChange={(content) =>
                                    setNoteForm((prev) => ({ ...prev, content }))
                                }
                            />
                        </div>
                        <Button size="sm" type="submit" disabled={isDeletingRest} className="w-full mt-1">Save Note</Button>
                    </form>
                </div>

                {/* Notes Feed */}
                <div className="w-full md:w-2/3 flex flex-col gap-3">
                    {notes.length === 0 ? (
                        <div className="border border-dashed rounded-xl p-12 flex items-center justify-center flex-col text-muted-foreground gap-3">
                            <FileEdit className="size-8 opacity-20" />
                            <span className="text-sm">No clinical notes recorded yet.</span>
                        </div>
                    ) : notes.map(n => (
                        <div key={n.id} className={cn("p-4 border rounded-xl flex flex-col gap-2 relative group transition-colors", 
                            n.priority === "CRITICAL" ? "bg-destructive/5 border-destructive/20" : 
                            n.priority === "URGENT" ? "bg-warning/5 border-warning/20" : "bg-card hover:bg-muted/10")}>
                            
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={cn("text-[10px] uppercase font-bold", 
                                        n.priority === "CRITICAL" ? "border-destructive text-destructive bg-destructive/10" : 
                                        n.priority === "URGENT" ? "border-warning-foreground text-warning-foreground bg-warning/10" : "bg-muted")}>
                                        {n.noteType}
                                    </Badge>
                                    <span className="text-xs font-semibold text-muted-foreground">
                                        Dr. {n.recordedBy || "System"} • {new Date(n.recordedAt).toLocaleString()}
                                    </span>
                                </div>
                                <Button variant="ghost" size="icon" className="size-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive" onClick={async () => {
                                    if(confirm("Delete note?")) { await deleteNote(n.id, admission.id); mutateNotes() }
                                }}><Trash2 className="size-3" /></Button>
                            </div>

                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed mt-1">
                                {n.content}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === "orders" && (
            <OrdersTab admission={admission} />
          )}

      </div>

      {/* ─── Sticky Footer Actions ─── */}
      <div className="flex justify-between items-center p-4 border-t bg-muted/20 shrink-0">
          <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2 bg-background shadow-sm" onClick={() => { setActiveTab("vitals"); setShowVitalsForm(true); }}>
                  <HeartPulse className="size-3.5 text-rose-500" /> Record Vitals
              </Button>
              <Button variant="outline" size="sm" className="gap-2 bg-background shadow-sm" onClick={() => setActiveTab("io")}>
                  <Scale className="size-3.5 text-blue-500" /> Add I/O
              </Button>
              <Button variant="outline" size="sm" className="gap-2 bg-background shadow-sm" onClick={() => setActiveTab("notes")}>
                  <FileEdit className="size-3.5 text-amber-500" /> Clinical Note
              </Button>
          </div>
          <div className="flex gap-2">
              {canInitiateDischarge && (
                  <Button variant="secondary" size="sm" onClick={() => router.push(`/admissions/${admission.id}/discharge`)}>
                      <XCircle className="size-3.5 mr-1.5" /> Discharge
                  </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => router.push(`/admissions/${admission.id}/transfer`)}>
                  <ArrowRight className="size-3.5 mr-1.5" /> Transfer
              </Button>
              <Button onClick={onClose} size="sm" variant="default" className="w-20">Close</Button>
          </div>
      </div>
    </div>
  )
}

// Helpers ----------------------------------------
function VitalBadge({ label, val, level }: { label: string, val: string, level: string }) {
    return (
        <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{label}</span>
            <span className={cn("text-base font-extrabold", 
                level === "critical" ? "text-destructive" :
                level === "warning" ? "text-warning-foreground" :
                "text-foreground"
            )}>{val}</span>
        </div>
    )
}

function VitalTxt({ val, lvl, sfx="" }: { val: any, lvl: string, sfx?: string }) {
    if (val == null || val === "") return <span className="text-muted-foreground">—</span>
    return <span className={cn("font-semibold", 
        lvl === "critical" ? "text-destructive" :
        lvl === "warning" ? "text-warning-foreground" :
        "text-foreground"
    )}>{val}{sfx}</span>
}
