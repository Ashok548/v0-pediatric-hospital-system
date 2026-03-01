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
import { useMutation } from "@/hooks/use-mutation"
import type { BabyStatus } from "@carenest/shared-types"

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormField { value: string; error: string; touched: boolean }
interface UploadedFile { id: string; name: string; size: string; type: string }

// The shape the backend returns on successful patient creation
interface CreatedPatient {
  id: string
  uhid: string
  firstName: string
  lastName: string
}

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

// ─── Reusable Form Input Component ──────────────────────────────────────────
function FI({ label, field, set, vfn, type = "text", ph, req = true, icon: Ic, maxLen, cls, disabled = false, validateFallback }: {
  label: string; field: FormField; set: React.Dispatch<React.SetStateAction<FormField>>
  vfn?: (f: FormField) => string; type?: string; ph?: string; req?: boolean
  icon?: React.ComponentType<{ className?: string }>; maxLen?: number; cls?: string; disabled?: boolean;
  validateFallback: (f: FormField, lbl: string, r?: boolean) => string
}) {
  const v = vfn || ((f: FormField) => validateFallback(f, label, req))
  const err = field.touched && field.error
  return (
    <div className={cn("flex flex-col gap-1.5", cls)}>
      <Label className="text-sm">{label}{req && <span className="text-destructive ml-0.5">*</span>}</Label>
      <div className="relative">
        {Ic && <Ic className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />}
        <Input type={type} value={field.value}
          onChange={e => { const val = e.target.value; set(f => { const u = { ...f, value: val }; return { ...u, error: f.touched ? v(u) : "" } }) }}
          onBlur={() => set(f => ({ ...f, touched: true, error: v(f) }))}
          placeholder={ph} maxLength={maxLen} disabled={disabled}
          className={cn("h-10 bg-card", Ic && "pl-9", err && "border-destructive")} />
      </div>
      {err && <p className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="size-3" />{field.error}</p>}
    </div>
  )
}

export function PatientRegistrationContent() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [createdPatient, setCreatedPatient] = useState<CreatedPatient | null>(null)
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
  const [guardianPhone, setGuardianPhone] = useState<FormField>(ef())
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

  // NICU Admission states (UI-only, Admission module will wire this)
  const [directNicu, setDirectNicu] = useState(false)
  const [nicuBed, setNicuBed] = useState<FormField>(ef())
  const [nicuGest, setNicuGest] = useState<FormField>(ef())
  const [nicuStatus, setNicuStatus] = useState<BabyStatus>("stable")

  const isNeonate = dob.value ? calcAge(dob.value).years === 0 && calcAge(dob.value).months === 0 : false

  // ─── Validation ─────────────────────────────────────────────────────────────
  const validate = useCallback((f: FormField, lbl: string, req = true) =>
    req && !f.value.trim() ? `${lbl} is required` : "", [])
  const vPhone = useCallback((f: FormField) =>
    !f.value.trim() ? "Phone is required" :
      !/^\+?\d{10,15}$/.test(f.value.replace(/\s/g, "")) ? "Enter valid phone (10-15 digits)" : "", [])
  const vOptPhone = useCallback((f: FormField) =>
    f.value.trim() && !/^\+?\d{10,15}$/.test(f.value.replace(/\s/g, "")) ? "Enter valid phone (10-15 digits)" : "", [])
  const vEmail = useCallback((f: FormField) =>
    f.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value) ? "Enter valid email" : "", [])
  const vAbha = useCallback((f: FormField) =>
    f.value.trim() && !/^\d{2}-\d{4}-\d{4}-\d{4}$/.test(f.value) ? "ABHA must be in format XX-XXXX-XXXX-XXXX" : "", [])
  const vDob = useCallback((f: FormField) => {
    if (!f.value.trim()) return "Date of birth is required"
    if (new Date(f.value) > new Date()) return "Date of birth cannot be in the future"
    return ""
  }, [])

  const allErrors = () => [
    validate(firstName, "First name"), validate(lastName, "Last name"),
    vDob(dob), validate(gender, "Gender"),
    validate(guardianName, "Guardian name"),
    vPhone(phone), vEmail(email), vOptPhone(guardianPhone), vAbha(abha),
    ...(hasIns ? [validate(insProvider, "Insurance provider"), validate(policyNo, "Policy number")] : []),
  ].filter(Boolean)

  // ─── API Mutation ────────────────────────────────────────────────────────────
  const { trigger: createPatient, isMutating } = useMutation<CreatedPatient>(
    "/patients",
    "POST",
    {
      successMessage: "Patient registered successfully!",
      onSuccess: (patient) => {
        setCreatedPatient(patient)
      },
    }
  )

  const handleSubmit = async () => {
    // Touch all fields to show errors
    setFirstName(f => ({ ...f, touched: true, error: validate(f, "First name") }))
    setLastName(f => ({ ...f, touched: true, error: validate(f, "Last name") }))
    setDob(f => ({ ...f, touched: true, error: vDob(f) }))
    setGender(f => ({ ...f, touched: true, error: validate(f, "Gender") }))
    setGuardianName(f => ({ ...f, touched: true, error: validate(f, "Guardian name") }))
    setPhone(f => ({ ...f, touched: true, error: vPhone(f) }))
    setEmail(f => ({ ...f, touched: true, error: vEmail(f) }))
    setGuardianPhone(f => ({ ...f, touched: true, error: vOptPhone(f) }))
    setAbha(f => ({ ...f, touched: true, error: vAbha(f) }))
    if (hasIns) {
      setInsProvider(f => ({ ...f, touched: true, error: validate(f, "Insurance provider") }))
      setPolicyNo(f => ({ ...f, touched: true, error: validate(f, "Policy number") }))
    }

    if (allErrors().length > 0) return

    // Map gender value to backend enum
    const genderMap: Record<string, "MALE" | "FEMALE" | "OTHER"> = {
      "Male": "MALE", "Female": "FEMALE", "Other": "OTHER",
    }

    // Build the CreatePatientDto payload
    const payload: Record<string, unknown> = {
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      gender: genderMap[gender.value] ?? "OTHER",
      dateOfBirth: dob.value,
      phone: phone.value.trim(),
      guardianName: guardianName.value.trim(),
    }
    // Optional fields — only include if non-empty
    if (blood.value) payload.bloodGroup = blood.value
    if (email.value.trim()) payload.email = email.value.trim()
    if (guardianPhone.value.trim()) payload.guardianPhone = guardianPhone.value.trim()
    if (guardianRel.value) payload.guardianRelationship = guardianRel.value
    if (birthWeight.value.trim()) payload.birthWeight = Number(birthWeight.value)
    if (address.value.trim()) payload.address = address.value.trim()
    if (city.value.trim()) payload.city = city.value.trim()
    if (stateName.value.trim()) payload.state = stateName.value.trim()
    if (pincode.value.trim()) payload.pincode = pincode.value.trim()
    if (abha.value.trim()) payload.abhaId = abha.value.trim()

    await createPatient(payload as any)
  }

  const addFiles = (fl: FileList | null) => {
    if (!fl) return
    setFiles(prev => [...prev, ...Array.from(fl).map(f => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: f.name, size: formatFileSize(f.size), type: f.type,
    }))])
  }

  // Remove inline FI component completely

  // ─── Success Screen ──────────────────────────────────────────────────────────
  if (createdPatient) return (
    <div className="p-4 lg:p-6 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-lg w-full text-center">
        <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
          <div className="flex items-center justify-center size-16 rounded-full bg-emerald-50 border-2 border-emerald-200">
            <Check className="size-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Patient Registered Successfully</h2>
            <p className="text-sm text-muted-foreground">{createdPatient.firstName} {createdPatient.lastName} has been registered</p>
          </div>
          <Badge className="bg-primary/10 text-primary border border-primary/20 text-base font-mono px-4 py-1.5">
            {createdPatient.uhid}
          </Badge>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" onClick={() => { setCreatedPatient(null); router.push("/patients/register") }} className="gap-1.5">
              <UserPlus className="size-4" />Register Another
            </Button>
            <Button onClick={() => router.push(`/patients/${createdPatient.id}`)} className="gap-1.5">
              <FileText className="size-4" />View Patient
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const disabled = isMutating

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Patient Registration</h1>
          <p className="text-sm text-muted-foreground">Register a new pediatric patient at CareNest Children{"'"}s Hospital</p>
        </div>
        <Badge className="bg-muted text-muted-foreground border border-border font-mono text-sm px-3 py-1 self-start gap-1">
          <Hash className="size-3.5" />UHID auto-generated
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
                <FI label="First Name" field={firstName} set={setFirstName} ph="First name" icon={User} validateFallback={validate} />
                <FI label="Last Name" field={lastName} set={setLastName} ph="Last name" icon={User} validateFallback={validate} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FI label="Date of Birth" field={dob} set={setDob} type="date" icon={CalendarDays} vfn={vDob} validateFallback={validate} />
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Gender<span className="text-destructive ml-0.5">*</span></Label>
                  <Select value={gender.value} onValueChange={v => setGender({ value: v, error: "", touched: true })} disabled={disabled}>
                    <SelectTrigger className={cn("h-10 w-full bg-card", gender.touched && gender.error && "border-destructive")}><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                  </Select>
                  {gender.touched && gender.error && <p className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="size-3" />{gender.error}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Blood Group</Label>
                  <Select value={blood.value} onValueChange={v => setBlood({ value: v, error: "", touched: true })} disabled={disabled}>
                    <SelectTrigger className="h-10 w-full bg-card"><SelectValue placeholder="Blood group" /></SelectTrigger>
                    <SelectContent>{BLOOD_GROUPS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <FI label="Birth Weight (kg)" field={birthWeight} set={setBirthWeight} type="number" ph="e.g. 3.2" req={false} validateFallback={validate} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Assigned Doctor</Label>
                  <Select value={doctor.value} onValueChange={v => setDoctor({ value: v, error: "", touched: true })} disabled={disabled}>
                    <SelectTrigger className="h-10 w-full bg-card"><SelectValue placeholder="Select doctor" /></SelectTrigger>
                    <SelectContent>{DOCTORS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <FI label="ABHA ID" field={abha} set={setAbha} vfn={vAbha} ph="14-1234-5678-9012" req={false} icon={CreditCard} maxLen={17} validateFallback={validate} />
              </div>

              {/* NICU Admission Toggle (UI-only — Admission module will wire this) */}
              {isNeonate && (
                <div className="flex flex-col gap-4 mt-2 p-4 rounded-xl border border-border bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <Label className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Baby className="size-4 text-[#c53030]" /> Direct NICU Admission
                      </Label>
                      <p className="text-xs text-muted-foreground">Register and admit this neonate directly to the NICU</p>
                    </div>
                    <Switch checked={directNicu} onCheckedChange={setDirectNicu} disabled={disabled} />
                  </div>
                  {directNicu && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border mt-1">
                      <FI label="Incubator / Bed No." field={nicuBed} set={setNicuBed} ph="e.g. N-15" validateFallback={validate} />
                      <FI label="Gestational Age" field={nicuGest} set={setNicuGest} ph="e.g. 34 weeks + 2 days" validateFallback={validate} />
                      <div className="flex flex-col gap-1.5 col-span-2">
                        <Label className="text-sm">Initial Status</Label>
                        <div className="flex gap-2">
                          {(["stable", "warning", "critical"] as BabyStatus[]).map(s => (
                            <button key={s} type="button" onClick={() => setNicuStatus(s)} disabled={disabled}
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
                <FI label="Guardian Full Name" field={guardianName} set={setGuardianName} ph="Guardian name" icon={User} validateFallback={validate} />
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Relation<span className="text-destructive ml-0.5">*</span></Label>
                  <Select value={guardianRel.value} onValueChange={v => setGuardianRel({ value: v, error: "", touched: true })} disabled={disabled}>
                    <SelectTrigger className="h-10 w-full bg-card"><SelectValue placeholder="Select relation" /></SelectTrigger>
                    <SelectContent>
                      {["Father", "Mother", "Grandfather", "Grandmother", "Legal Guardian", "Other"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FI label="Mobile Number" field={phone} set={setPhone} vfn={vPhone} ph="10-digit mobile" icon={Phone} maxLen={15} validateFallback={validate} />
                <FI label="Guardian Alt. Number" field={guardianPhone} set={setGuardianPhone} vfn={vOptPhone} ph="Optional" icon={Phone} req={false} maxLen={15} validateFallback={validate} />
              </div>
              <FI label="Email Address" field={email} set={setEmail} vfn={vEmail} type="email" ph="guardian@example.com" req={false} validateFallback={validate} />
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
              <FI label="Street Address" field={address} set={setAddress} ph="House no., Street, Area" icon={MapPin} req={false} validateFallback={validate} />
              <div className="grid grid-cols-3 gap-4">
                <FI label="City" field={city} set={setCity} ph="City" req={false} validateFallback={validate} />
                <FI label="State" field={stateName} set={setStateName} ph="State" req={false} validateFallback={validate} />
                <FI label="Pincode" field={pincode} set={setPincode} ph="6-digit" maxLen={6} req={false} validateFallback={validate} />
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
                <button type="button" role="switch" aria-checked={hasIns} onClick={() => setHasIns(!hasIns)} disabled={disabled}
                  className={cn("relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors", hasIns ? "bg-primary" : "bg-input")}>
                  <span className={cn("pointer-events-none inline-block size-5 transform rounded-full bg-card shadow-lg transition-transform", hasIns ? "translate-x-5" : "translate-x-0")} />
                </button>
                <Label className="text-sm">Patient has health insurance</Label>
              </div>
              {hasIns ? (
                <div className="flex flex-col gap-4 pt-2 border-t border-border">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm">Insurance Provider<span className="text-destructive ml-0.5">*</span></Label>
                    <Select value={insProvider.value} onValueChange={v => setInsProvider({ value: v, error: "", touched: true })} disabled={disabled}>
                      <SelectTrigger className="h-10 w-full bg-card"><SelectValue placeholder="Select provider" /></SelectTrigger>
                      <SelectContent>{INSURANCE_PROVIDERS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FI label="Policy Number" field={policyNo} set={setPolicyNo} ph="Policy / Claim ID" icon={CreditCard} validateFallback={validate} />
                    <FI label="Policy Holder" field={policyHolder} set={setPolicyHolder} ph="Name on policy" req={false} validateFallback={validate} />
                  </div>
                  <FI label="Valid Till" field={validTill} set={setValidTill} type="date" req={false} icon={CalendarDays} validateFallback={validate} />
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
                  <Select value={refSource.value} onValueChange={v => setRefSource({ value: v, error: "", touched: true })} disabled={disabled}>
                    <SelectTrigger className="h-10 w-full bg-card"><SelectValue placeholder="How did patient arrive?" /></SelectTrigger>
                    <SelectContent>{REFERRAL_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <FI label="Referring Doctor" field={refDoc} set={setRefDoc} ph="Dr. name (if any)" req={false} icon={Building2} validateFallback={validate} />
              </div>
              <FI label="Known Allergies" field={allergies} set={setAllergies} ph="e.g. Penicillin, None known" req={false} validateFallback={validate} />
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Additional Medical Notes</Label>
                <textarea value={notes.value} onChange={e => setNotes(f => ({ ...f, value: e.target.value }))}
                  disabled={disabled} placeholder="Pre-existing conditions, medications, special instructions..."
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
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50", disabled && "pointer-events-none opacity-50")}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
                onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}>
                <div className="flex items-center justify-center size-12 rounded-full bg-muted"><Upload className="size-5 text-muted-foreground" /></div>
                <div className="text-center">
                  <p className="text-sm font-medium">Drag &amp; drop or <span className="text-primary underline underline-offset-2">browse</span></p>
                  <p className="text-xs text-muted-foreground">PDF, JPG, PNG up to 10MB each</p>
                </div>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden" onChange={e => addFiles(e.target.files)} disabled={disabled} />
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

      {/* ── Sticky Footer ───────────────────────────────────────────────────── */}
      <Card className="sticky bottom-0 z-20">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="size-4 shrink-0" />
            <span>Fields marked with <span className="text-destructive font-semibold">*</span> are mandatory</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outline" className="gap-1.5" onClick={() => router.back()} disabled={isMutating}><X className="size-4" />Cancel</Button>
            <Button onClick={handleSubmit} disabled={isMutating} className="gap-1.5 min-w-[160px]">
              {isMutating
                ? <><svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>Registering...</>
                : <><Save className="size-4" />Register Patient</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
