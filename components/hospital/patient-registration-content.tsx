"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  User, Baby, Phone, MapPin, Shield, FileUp, Save, X, Check, AlertCircle,
  Upload, FileText, Trash2, UserPlus, Hash, CalendarDays, Heart, Building2, CreditCard,
} from "lucide-react"
import { addPatient, generateUHID, updatePatientStatus } from "@/lib/store/patients"
import { addNicuBaby } from "@/lib/store/nicu"
import type { Patient, PatientDetail, BabyStatus } from "@/lib/data/types"

interface FormField { value: string; error: string; touched: boolean }
interface UploadedFile { id: string; name: string; size: string; type: string }

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function calcAge(dob: string) {
  const d = new Date(dob), now = new Date()
  let years = now.getFullYear() - d.getFullYear()
  let months = now.getMonth() - d.getMonth()
  if (months < 0) { years--; months += 12 }
  return { years, months, display: years === 0 ? `${months} months` : `${years}y ${months}mo` }
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
const INSURANCE_PROVIDERS = ["Star Health", "ICICI Lombard", "HDFC Ergo", "New India Assurance", "Max Bupa", "Bajaj Allianz", "Niva Bupa", "Care Health", "Other"]
const REFERRAL_SOURCES = ["Self / Walk-in", "Doctor Referral", "Other Hospital", "Emergency (108 / Ambulance)", "Online Appointment"]
const DOCTORS = ["Dr. Priya Reddy", "Dr. Anil Kumar", "Dr. Meera Iyer"]

export function PatientRegistrationContent() {
  const [uhid] = useState(generateUHID)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const ef = (v = ""): FormField => ({ value: v, error: "", touched: false })

  const [firstName, setFirstName] = useState<FormField>(ef())
  const [lastName, setLastName] = useState<FormField>(ef())
  const [dob, setDob] = useState<FormField>(ef())
  const [gender, setGender] = useState<FormField>(ef())
  const [blood, setBlood] = useState<FormField>(ef())
  const [birthWeight, setBirthWeight] = useState<FormField>(ef())
  const [doctor, setDoctor] = useState<FormField>(ef())
  const [guardianName, setGuardianName] = useState<FormField>(ef())
  const [guardianRel, setGuardianRel] = useState<FormField>(ef())
  const [phone, setPhone] = useState<FormField>(ef())
  const [altPhone, setAltPhone] = useState<FormField>(ef())
  const [email, setEmail] = useState<FormField>(ef())
  const [address, setAddress] = useState<FormField>(ef())
  const [city, setCity] = useState<FormField>(ef())
  const [stateName, setStateName] = useState<FormField>(ef())
  const [pincode, setPincode] = useState<FormField>(ef())
  const [hasIns, setHasIns] = useState(false)
  const [insProvider, setInsProvider] = useState<FormField>(ef())
  const [policyNo, setPolicyNo] = useState<FormField>(ef())
  const [policyHolder, setPolicyHolder] = useState<FormField>(ef())
  const [validTill, setValidTill] = useState<FormField>(ef())
  const [abha, setAbha] = useState<FormField>(ef())
  const [refSource, setRefSource] = useState<FormField>(ef())
  const [refDoc, setRefDoc] = useState<FormField>(ef())
  const [allergies, setAllergies] = useState<FormField>(ef())
  const [notes, setNotes] = useState<FormField>(ef())
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragOver, setDragOver] = useState(false)

  // NICU Admission states
  const [directNicu, setDirectNicu] = useState(false)
  const [nicuBed, setNicuBed] = useState<FormField>(ef())
  const [nicuGest, setNicuGest] = useState<FormField>(ef())
  const [nicuStatus, setNicuStatus] = useState<BabyStatus>("stable")

  const isNeonate = dob.value ? calcAge(dob.value).years === 0 && calcAge(dob.value).months === 0 : false

  const validate = useCallback((f: FormField, lbl: string, req = true) =>
    req && !f.value.trim() ? `${lbl} is required` : "", [])
  const vPhone = useCallback((f: FormField) =>
    !f.value.trim() ? "Phone is required" :
      !/^[6-9]\d{9}$/.test(f.value.replace(/\s/g, "")) ? "Enter valid 10-digit mobile" : "", [])
  const vEmail = useCallback((f: FormField) =>
    f.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value) ? "Enter valid email" : "", [])
  const vPin = useCallback((f: FormField) =>
    !f.value.trim() ? "Pincode required" : !/^\d{6}$/.test(f.value) ? "Enter 6-digit pincode" : "", [])
  const vAbha = useCallback((f: FormField) =>
    f.value.trim() && !/^\d{14}$/.test(f.value.replace(/[\s-]/g, "")) ? "ABHA must be 14 digits" : "", [])

  const allErrors = () => [
    validate(firstName, "First name"), validate(lastName, "Last name"),
    validate(dob, "Date of birth"), validate(gender, "Gender"),
    validate(guardianName, "Guardian name"), validate(guardianRel, "Relation"),
    vPhone(phone), validate(address, "Address"), validate(city, "City"),
    validate(stateName, "State"), vPin(pincode), vEmail(email),
    ...(hasIns ? [validate(insProvider, "Insurance provider"), validate(policyNo, "Policy number")] : []),
  ].filter(Boolean)

  const handleSubmit = () => {
    setFirstName(f => ({ ...f, touched: true, error: validate(f, "First name") }))
    setLastName(f => ({ ...f, touched: true, error: validate(f, "Last name") }))
    setDob(f => ({ ...f, touched: true, error: validate(f, "Date of birth") }))
    setGender(f => ({ ...f, touched: true, error: validate(f, "Gender") }))
    setGuardianName(f => ({ ...f, touched: true, error: validate(f, "Guardian name") }))
    setGuardianRel(f => ({ ...f, touched: true, error: validate(f, "Relation") }))
    setPhone(f => ({ ...f, touched: true, error: vPhone(f) }))
    setAddress(f => ({ ...f, touched: true, error: validate(f, "Address") }))
    setCity(f => ({ ...f, touched: true, error: validate(f, "City") }))
    setStateName(f => ({ ...f, touched: true, error: validate(f, "State") }))
    setPincode(f => ({ ...f, touched: true, error: vPin(f) }))
    setEmail(f => ({ ...f, touched: true, error: vEmail(f) }))
    if (hasIns) {
      setInsProvider(f => ({ ...f, touched: true, error: validate(f, "Insurance provider") }))
      setPolicyNo(f => ({ ...f, touched: true, error: validate(f, "Policy number") }))
    }
    if (directNicu && isNeonate) {
      setNicuBed(f => ({ ...f, touched: true, error: validate(f, "Incubator no.") }))
      setNicuGest(f => ({ ...f, touched: true, error: validate(f, "Gestational age") }))
    }

    const allErrs = [
      ...allErrors(),
      ...(directNicu && isNeonate ? [validate(nicuBed, "Incubator no."), validate(nicuGest, "Gestational age")] : [])
    ]
    if (allErrs.filter(Boolean).length > 0) return

    setSaving(true)
    setTimeout(() => {
      const age = dob.value ? calcAge(dob.value) : { years: 0, months: 0, display: "0 months" }
      const gCode = gender.value === "Female" ? "F" as const : "M" as const
      const assignedDoc = doctor.value || "Dr. Priya Reddy"
      const dobFmt = dob.value ? new Date(dob.value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""

      const newPatient: Patient = {
        uhid, firstName: firstName.value, lastName: lastName.value,
        ageYears: age.years, ageMonths: age.months, gender: gCode,
        guardianName: guardianName.value, status: "OP", doctor: assignedDoc,
        lastModified: new Date(), phone: phone.value,
      }
      const newDetail: PatientDetail = {
        uhid, name: `${firstName.value} ${lastName.value}`, dob: dobFmt,
        age: age.display, gender: gCode, bloodGroup: blood.value || "Unknown",
        weight: birthWeight.value ? `${birthWeight.value} kg` : "—",
        guardian: `${guardianName.value} (${guardianRel.value})`,
        phone: `+91 ${phone.value}`, doctor: assignedDoc, status: directNicu && isNeonate ? "NICU" : "OP",
        diagnosis: notes.value || "Awaiting assessment",
      }

      if (directNicu && isNeonate) {
        newPatient.status = "NICU"
        newPatient.wardBed = `NICU / Bed ${nicuBed.value}`
        newDetail.wardBed = `NICU / Bed ${nicuBed.value}`
        addNicuBaby({
          id: uhid,
          name: `${firstName.value} ${lastName.value}`,
          bed: nicuBed.value,
          gestationalAge: nicuGest.value,
          weight: birthWeight.value ? `${birthWeight.value} kg` : "2.5 kg",
          status: nicuStatus,
          vitals: { heartRate: 140, spo2: 98, temperature: 36.5 },
          alerts: nicuStatus === "critical" ? ["Continuous Monitoring Required"] : [],
          admittedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          doctor: assignedDoc
        })
      }

      addPatient(newPatient, newDetail)
      setSaving(false)
      setSubmitted(true)
    }, 1400)
  }

  const addFiles = (fl: FileList | null) => {
    if (!fl) return
    setFiles(prev => [...prev, ...Array.from(fl).map(f => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: f.name, size: formatFileSize(f.size), type: f.type,
    }))])
  }

  function FI({ label, field, set, vfn, type = "text", ph, req = true, icon: Ic, disabled: dis, maxLen, cls }: {
    label: string; field: FormField; set: React.Dispatch<React.SetStateAction<FormField>>
    vfn?: (f: FormField) => string; type?: string; ph?: string; req?: boolean
    icon?: React.ComponentType<{ className?: string }>; disabled?: boolean; maxLen?: number; cls?: string
  }) {
    const v = vfn || ((f: FormField) => validate(f, label, req))
    const err = field.touched && field.error
    return (
      <div className={cn("flex flex-col gap-1.5", cls)}>
        <Label className="text-sm">{label}{req && <span className="text-destructive ml-0.5">*</span>}</Label>
        <div className="relative">
          {Ic && <Ic className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />}
          <Input type={type} value={field.value}
            onChange={e => { const val = e.target.value; set(f => { const u = { ...f, value: val }; return { ...u, error: f.touched ? v(u) : "" } }) }}
            onBlur={() => set(f => ({ ...f, touched: true, error: v(f) }))}
            placeholder={ph} maxLength={maxLen} disabled={dis || submitted}
            className={cn("h-10 bg-card", Ic && "pl-9", err && "border-destructive")} />
        </div>
        {err && <p className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="size-3" />{field.error}</p>}
      </div>
    )
  }

  if (submitted) return (
    <div className="p-4 lg:p-6 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-lg w-full text-center">
        <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
          <div className="flex items-center justify-center size-16 rounded-full bg-emerald-50 border-2 border-emerald-200">
            <Check className="size-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Patient Registered Successfully</h2>
            <p className="text-sm text-muted-foreground">{firstName.value} {lastName.value} has been registered</p>
          </div>
          <Badge className="bg-primary/10 text-primary border border-primary/20 text-base font-mono px-4 py-1.5">{uhid}</Badge>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => router.push("/patients/register")} className="gap-1.5">
              <UserPlus className="size-4" />Register Another
            </Button>
            <Button onClick={() => router.push(`/patients/${uhid}`)} className="gap-1.5">
              <FileText className="size-4" />View Patient
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Patient Registration</h1>
          <p className="text-sm text-muted-foreground">Register a new pediatric patient at CareNest Children{"'"}s Hospital</p>
        </div>
        <Badge className="bg-primary/10 text-primary border border-primary/20 font-mono text-sm px-3 py-1 self-start">
          <Hash className="size-3.5 mr-1" />{uhid}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10"><Baby className="size-4 text-primary" /></div>
                <div><CardTitle className="text-base">Child Details</CardTitle><CardDescription>Primary patient information</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <FI label="First Name" field={firstName} set={setFirstName} ph="First name" icon={User} />
                <FI label="Last Name" field={lastName} set={setLastName} ph="Last name" icon={User} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FI label="Date of Birth" field={dob} set={setDob} type="date" icon={CalendarDays} />
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Gender<span className="text-destructive ml-0.5">*</span></Label>
                  <Select value={gender.value} onValueChange={v => setGender({ value: v, error: "", touched: true })} disabled={submitted}>
                    <SelectTrigger className={cn("h-10 w-full bg-card", gender.touched && gender.error && "border-destructive")}><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                  </Select>
                  {gender.touched && gender.error && <p className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="size-3" />{gender.error}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Blood Group</Label>
                  <Select value={blood.value} onValueChange={v => setBlood({ value: v, error: "", touched: true })} disabled={submitted}>
                    <SelectTrigger className="h-10 w-full bg-card"><SelectValue placeholder="Blood group" /></SelectTrigger>
                    <SelectContent>{BLOOD_GROUPS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <FI label="Birth Weight (kg)" field={birthWeight} set={setBirthWeight} type="number" ph="e.g. 3.2" req={false} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Assigned Doctor</Label>
                  <Select value={doctor.value} onValueChange={v => setDoctor({ value: v, error: "", touched: true })} disabled={submitted}>
                    <SelectTrigger className="h-10 w-full bg-card"><SelectValue placeholder="Select doctor" /></SelectTrigger>
                    <SelectContent>{DOCTORS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <FI label="ABHA ID" field={abha} set={setAbha} vfn={vAbha} ph="91-1234-5678-9012" req={false} icon={CreditCard} maxLen={17} />
              </div>

              {/* NICU Admission Toggle (Neonates only) */}
              {isNeonate && (
                <div className="flex flex-col gap-4 mt-2 p-4 rounded-xl border border-border bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <Label className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Baby className="size-4 text-[#c53030]" /> Direct NICU Admission
                      </Label>
                      <p className="text-xs text-muted-foreground">Register and admit this neonate directly to the NICU</p>
                    </div>
                    <Switch checked={directNicu} onCheckedChange={setDirectNicu} disabled={submitted} />
                  </div>

                  {directNicu && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border mt-1">
                      <FI label="Incubator / Bed No." field={nicuBed} set={setNicuBed} ph="e.g. N-15" />
                      <FI label="Gestational Age" field={nicuGest} set={setNicuGest} ph="e.g. 34 weeks + 2 days" />
                      <div className="flex flex-col gap-1.5 col-span-2">
                        <Label className="text-sm">Initial Status</Label>
                        <div className="flex gap-2">
                          {(["stable", "warning", "critical"] as BabyStatus[]).map(s => (
                            <button key={s} type="button" onClick={() => setNicuStatus(s)} disabled={submitted}
                              className={cn("px-4 py-1.5 rounded-full text-xs font-semibold border capitalize transition-all",
                                nicuStatus === s
                                  ? s === "stable" ? "bg-[#e6f6ee] text-[#1a7a4c] border-[#1a7a4c]"
                                    : s === "warning" ? "bg-[#fff8e1] text-[#b45309] border-[#b45309]"
                                      : "bg-[#fde8e8] text-[#c53030] border-[#c53030]"
                                  : "bg-card border-border text-muted-foreground hover:border-primary/40"
                              )}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-500/10"><User className="size-4 text-emerald-600" /></div>
                <div><CardTitle className="text-base">Guardian / Parent Details</CardTitle><CardDescription>Primary contact information</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <FI label="Guardian Full Name" field={guardianName} set={setGuardianName} ph="Guardian name" icon={User} />
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Relation<span className="text-destructive ml-0.5">*</span></Label>
                  <Select value={guardianRel.value} onValueChange={v => setGuardianRel({ value: v, error: "", touched: true })} disabled={submitted}>
                    <SelectTrigger className={cn("h-10 w-full bg-card", guardianRel.touched && guardianRel.error && "border-destructive")}><SelectValue placeholder="Select relation" /></SelectTrigger>
                    <SelectContent>
                      {["Father", "Mother", "Grandfather", "Grandmother", "Legal Guardian", "Other"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {guardianRel.touched && guardianRel.error && <p className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="size-3" />{guardianRel.error}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FI label="Mobile Number" field={phone} set={setPhone} vfn={vPhone} ph="10-digit mobile" icon={Phone} maxLen={10} />
                <FI label="Alternate Number" field={altPhone} set={setAltPhone} ph="Optional" icon={Phone} req={false} />
              </div>
              <FI label="Email Address" field={email} set={setEmail} vfn={vEmail} type="email" ph="guardian@example.com" req={false} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-blue-500/10"><MapPin className="size-4 text-blue-600" /></div>
                <div><CardTitle className="text-base">Address</CardTitle><CardDescription>Residential address details</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FI label="Street Address" field={address} set={setAddress} ph="House no., Street, Area" icon={MapPin} />
              <div className="grid grid-cols-3 gap-4">
                <FI label="City" field={city} set={setCity} ph="City" />
                <FI label="State" field={stateName} set={setStateName} ph="State" />
                <FI label="Pincode" field={pincode} set={setPincode} vfn={vPin} ph="6-digit" maxLen={6} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-violet-500/10"><Shield className="size-4 text-violet-600" /></div>
                <div><CardTitle className="text-base">Insurance Details</CardTitle><CardDescription>Health insurance coverage</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <button type="button" role="switch" aria-checked={hasIns} onClick={() => setHasIns(!hasIns)} disabled={submitted}
                  className={cn("relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors", hasIns ? "bg-primary" : "bg-input")}>
                  <span className={cn("pointer-events-none inline-block size-5 transform rounded-full bg-card shadow-lg transition-transform", hasIns ? "translate-x-5" : "translate-x-0")} />
                </button>
                <Label className="text-sm">Patient has health insurance</Label>
              </div>
              {hasIns ? (
                <div className="flex flex-col gap-4 pt-2 border-t border-border">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm">Insurance Provider<span className="text-destructive ml-0.5">*</span></Label>
                    <Select value={insProvider.value} onValueChange={v => setInsProvider({ value: v, error: "", touched: true })} disabled={submitted}>
                      <SelectTrigger className={cn("h-10 w-full bg-card", insProvider.touched && insProvider.error && "border-destructive")}><SelectValue placeholder="Select provider" /></SelectTrigger>
                      <SelectContent>{INSURANCE_PROVIDERS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                    {insProvider.touched && insProvider.error && <p className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="size-3" />{insProvider.error}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FI label="Policy Number" field={policyNo} set={setPolicyNo} ph="Policy / Claim ID" icon={CreditCard} />
                    <FI label="Policy Holder" field={policyHolder} set={setPolicyHolder} ph="Name on policy" req={false} />
                  </div>
                  <FI label="Valid Till" field={validTill} set={setValidTill} type="date" req={false} icon={CalendarDays} />
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted border border-border">
                  <Shield className="size-4 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">No insurance on record. Patient will be registered under self-pay.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-amber-500/10"><Heart className="size-4 text-amber-600" /></div>
                <div><CardTitle className="text-base">Referral &amp; Medical Notes</CardTitle><CardDescription>Source of referral and initial notes</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Referral Source</Label>
                  <Select value={refSource.value} onValueChange={v => setRefSource({ value: v, error: "", touched: true })} disabled={submitted}>
                    <SelectTrigger className="h-10 w-full bg-card"><SelectValue placeholder="How did patient arrive?" /></SelectTrigger>
                    <SelectContent>{REFERRAL_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <FI label="Referring Doctor" field={refDoc} set={setRefDoc} ph="Dr. name (if any)" req={false} icon={Building2} />
              </div>
              <FI label="Known Allergies" field={allergies} set={setAllergies} ph="e.g. Penicillin, None known" req={false} />
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Additional Medical Notes</Label>
                <textarea value={notes.value} onChange={e => setNotes(f => ({ ...f, value: e.target.value }))}
                  disabled={submitted} placeholder="Pre-existing conditions, medications, special instructions..."
                  rows={3} className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:opacity-50 resize-none" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-cyan-500/10"><FileUp className="size-4 text-cyan-600" /></div>
                <div><CardTitle className="text-base">Upload Medical Reports</CardTitle><CardDescription>Previous reports, lab results, or referral letters</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className={cn("flex flex-col items-center justify-center gap-3 py-8 px-4 rounded-lg border-2 border-dashed transition-colors cursor-pointer",
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50", submitted && "pointer-events-none opacity-50")}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
                onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}>
                <div className="flex items-center justify-center size-12 rounded-full bg-muted"><Upload className="size-5 text-muted-foreground" /></div>
                <div className="text-center">
                  <p className="text-sm font-medium">Drag &amp; drop or <span className="text-primary underline underline-offset-2">browse</span></p>
                  <p className="text-xs text-muted-foreground">PDF, JPG, PNG up to 10MB each</p>
                </div>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden" onChange={e => addFiles(e.target.files)} disabled={submitted} />
              </div>
              {files.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground">{files.length} file(s) selected</p>
                  {files.map(f => (
                    <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2.5">
                      <div className="flex items-center justify-center size-8 rounded-lg bg-card border border-border shrink-0"><FileText className="size-4 text-muted-foreground" /></div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{f.name}</p><p className="text-xs text-muted-foreground">{f.size}</p></div>
                      <button onClick={() => setFiles(p => p.filter(x => x.id !== f.id))} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="size-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="sticky bottom-0 z-20">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="size-4 shrink-0" />
            <span>Fields marked with <span className="text-destructive font-semibold">*</span> are mandatory</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outline" className="gap-1.5" onClick={() => router.back()} disabled={saving}><X className="size-4" />Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving} className="gap-1.5 min-w-[140px]">
              {saving
                ? <><svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>Saving...</>
                : <><Save className="size-4" />Register Patient</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
