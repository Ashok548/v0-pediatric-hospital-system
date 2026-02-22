"use client"

import { useState, useRef, useCallback } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  User,
  Baby,
  Phone,
  MapPin,
  Shield,
  FileUp,
  Save,
  X,
  Check,
  AlertCircle,
  Upload,
  FileText,
  Trash2,
  UserPlus,
  Hash,
  CalendarDays,
  Heart,
  Building2,
  CreditCard,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────

interface FormField {
  value: string
  error: string
  touched: boolean
}

interface UploadedFile {
  id: string
  name: string
  size: string
  type: string
}

// ── Helpers ────────────────────────────────────────────────────────────

function generateUHID() {
  return `P-${String(Math.floor(2000 + Math.random() * 1000))}`
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
const insuranceProviders = [
  "Star Health",
  "ICICI Lombard",
  "HDFC Ergo",
  "New India Assurance",
  "Max Bupa",
  "Bajaj Allianz",
  "Niva Bupa",
  "Care Health",
  "Other",
]
const referralSources = [
  "Self / Walk-in",
  "Doctor Referral",
  "Other Hospital",
  "Emergency (108 / Ambulance)",
  "Online Appointment",
]

// ── Component ──────────────────────────────────────────────────────────

export function PatientRegistrationContent() {
  const [uhid] = useState(generateUHID)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  // ── Form State ─────────────────────────────────────────────────────
  const emptyField = (val = ""): FormField => ({ value: val, error: "", touched: false })

  const [childFirstName, setChildFirstName] = useState<FormField>(emptyField())
  const [childLastName, setChildLastName] = useState<FormField>(emptyField())
  const [dob, setDob] = useState<FormField>(emptyField())
  const [gender, setGender] = useState<FormField>(emptyField())
  const [bloodGroup, setBloodGroup] = useState<FormField>(emptyField())
  const [birthWeight, setBirthWeight] = useState<FormField>(emptyField())

  const [guardianName, setGuardianName] = useState<FormField>(emptyField())
  const [guardianRelation, setGuardianRelation] = useState<FormField>(emptyField())
  const [phone, setPhone] = useState<FormField>(emptyField())
  const [altPhone, setAltPhone] = useState<FormField>(emptyField())
  const [email, setEmail] = useState<FormField>(emptyField())

  const [address, setAddress] = useState<FormField>(emptyField())
  const [city, setCity] = useState<FormField>(emptyField())
  const [state, setState] = useState<FormField>(emptyField())
  const [pincode, setPincode] = useState<FormField>(emptyField())

  const [hasInsurance, setHasInsurance] = useState(false)
  const [insuranceProvider, setInsuranceProvider] = useState<FormField>(emptyField())
  const [policyNumber, setPolicyNumber] = useState<FormField>(emptyField())
  const [policyHolder, setPolicyHolder] = useState<FormField>(emptyField())
  const [validTill, setValidTill] = useState<FormField>(emptyField())

  const [referralSource, setReferralSource] = useState<FormField>(emptyField())
  const [referringDoctor, setReferringDoctor] = useState<FormField>(emptyField())
  const [knownAllergies, setKnownAllergies] = useState<FormField>(emptyField())
  const [medicalNotes, setMedicalNotes] = useState<FormField>(emptyField())

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragOver, setDragOver] = useState(false)

  // ── Validation ─────────────────────────────────────────────────────
  const validate = useCallback((field: FormField, label: string, required = true): string => {
    if (required && !field.value.trim()) return `${label} is required`
    return ""
  }, [])

  const validatePhone = useCallback((field: FormField): string => {
    if (!field.value.trim()) return "Phone number is required"
    if (!/^[6-9]\d{9}$/.test(field.value.replace(/\s/g, ""))) return "Enter a valid 10-digit mobile number"
    return ""
  }, [])

  const validateEmail = useCallback((field: FormField): string => {
    if (field.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) return "Enter a valid email address"
    return ""
  }, [])

  const validatePincode = useCallback((field: FormField): string => {
    if (!field.value.trim()) return "Pincode is required"
    if (!/^\d{6}$/.test(field.value)) return "Enter a valid 6-digit pincode"
    return ""
  }, [])

  const allErrors = () => {
    const errs: string[] = []
    errs.push(validate(childFirstName, "First name"))
    errs.push(validate(childLastName, "Last name"))
    errs.push(validate(dob, "Date of birth"))
    errs.push(validate(gender, "Gender"))
    errs.push(validate(guardianName, "Guardian name"))
    errs.push(validate(guardianRelation, "Relation"))
    errs.push(validatePhone(phone))
    errs.push(validate(address, "Address"))
    errs.push(validate(city, "City"))
    errs.push(validate(state, "State"))
    errs.push(validatePincode(pincode))
    errs.push(validateEmail(email))
    if (hasInsurance) {
      errs.push(validate(insuranceProvider, "Insurance provider"))
      errs.push(validate(policyNumber, "Policy number"))
    }
    return errs.filter(Boolean)
  }

  const handleSubmit = () => {
    // Touch all required fields
    setChildFirstName(f => ({ ...f, touched: true, error: validate(f, "First name") }))
    setChildLastName(f => ({ ...f, touched: true, error: validate(f, "Last name") }))
    setDob(f => ({ ...f, touched: true, error: validate(f, "Date of birth") }))
    setGender(f => ({ ...f, touched: true, error: validate(f, "Gender") }))
    setGuardianName(f => ({ ...f, touched: true, error: validate(f, "Guardian name") }))
    setGuardianRelation(f => ({ ...f, touched: true, error: validate(f, "Relation") }))
    setPhone(f => ({ ...f, touched: true, error: validatePhone(f) }))
    setAddress(f => ({ ...f, touched: true, error: validate(f, "Address") }))
    setCity(f => ({ ...f, touched: true, error: validate(f, "City") }))
    setState(f => ({ ...f, touched: true, error: validate(f, "State") }))
    setPincode(f => ({ ...f, touched: true, error: validatePincode(f) }))
    setEmail(f => ({ ...f, touched: true, error: validateEmail(f) }))
    if (hasInsurance) {
      setInsuranceProvider(f => ({ ...f, touched: true, error: validate(f, "Insurance provider") }))
      setPolicyNumber(f => ({ ...f, touched: true, error: validate(f, "Policy number") }))
    }

    const errors = allErrors()
    if (errors.length > 0) return

    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSubmitted(true)
    }, 1500)
  }

  // ── File Handling ──────────────────────────────────────────────────
  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const newFiles: UploadedFile[] = Array.from(fileList).map(f => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: f.name,
      size: formatFileSize(f.size),
      type: f.type,
    }))
    setUploadedFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
  }

  // ── Field Helper ───────────────────────────────────────────────────
  function FormInput({
    label,
    field,
    setField,
    validationFn,
    type = "text",
    placeholder,
    required = true,
    icon: Icon,
    disabled = false,
    maxLength,
    className,
  }: {
    label: string
    field: FormField
    setField: React.Dispatch<React.SetStateAction<FormField>>
    validationFn?: (f: FormField) => string
    type?: string
    placeholder?: string
    required?: boolean
    icon?: React.ComponentType<{ className?: string }>
    disabled?: boolean
    maxLength?: number
    className?: string
  }) {
    const vfn = validationFn || ((f: FormField) => validate(f, label, required))
    const hasError = field.touched && field.error

    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <Label className="text-sm text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          )}
          <Input
            type={type}
            value={field.value}
            onChange={(e) => {
              const v = e.target.value
              setField(f => {
                const updated = { ...f, value: v }
                return { ...updated, error: f.touched ? vfn(updated) : "" }
              })
            }}
            onBlur={() => {
              setField(f => ({ ...f, touched: true, error: vfn(f) }))
            }}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled || submitted}
            className={cn(
              "h-10 bg-card",
              Icon && "pl-9",
              hasError && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
            )}
            aria-invalid={!!hasError}
            aria-describedby={hasError ? `${label}-error` : undefined}
          />
        </div>
        {hasError && (
          <p id={`${label}-error`} className="flex items-center gap-1 text-xs text-destructive" role="alert">
            <AlertCircle className="size-3 shrink-0" />
            {field.error}
          </p>
        )}
      </div>
    )
  }

  // ── Success State ──────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-lg w-full text-center">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
            <div className="flex items-center justify-center size-16 rounded-full bg-emerald-50 border-2 border-emerald-200">
              <Check className="size-8 text-emerald-600" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-foreground">Patient Registered Successfully</h2>
              <p className="text-sm text-muted-foreground">
                {childFirstName.value} {childLastName.value} has been registered with UHID
              </p>
            </div>
            <Badge className="bg-primary/10 text-primary border border-primary/20 text-base font-mono px-4 py-1.5">
              {uhid}
            </Badge>
            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="gap-1.5"
              >
                <UserPlus className="size-4" />
                Register Another
              </Button>
              <Button className="gap-1.5">
                <FileText className="size-4" />
                View Patient
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Registration Form ──────────────────────────────────────────────
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
            New Patient Registration
          </h1>
          <p className="text-sm text-muted-foreground">
            Register a new pediatric patient at CareNest Children{"'"}s Hospital
          </p>
        </div>
        <Badge className="bg-primary/10 text-primary border border-primary/20 font-mono text-sm px-3 py-1 self-start">
          <Hash className="size-3.5 mr-1" />
          {uhid}
        </Badge>
      </div>

      {/* ── Form ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ──────────────────────── LEFT COLUMN ──────────────────────── */}
        <div className="flex flex-col gap-6">

          {/* Child Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10">
                  <Baby className="size-4 text-primary" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <CardTitle className="text-base">Child Details</CardTitle>
                  <CardDescription>Primary patient information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="First Name"
                  field={childFirstName}
                  setField={setChildFirstName}
                  placeholder="Enter first name"
                  icon={User}
                />
                <FormInput
                  label="Last Name"
                  field={childLastName}
                  setField={setChildLastName}
                  placeholder="Enter last name"
                  icon={User}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Date of Birth"
                  field={dob}
                  setField={setDob}
                  type="date"
                  icon={CalendarDays}
                />
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm text-foreground">
                    Gender<span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Select
                    value={gender.value}
                    onValueChange={(v) => {
                      setGender({ value: v, error: "", touched: true })
                    }}
                    disabled={submitted}
                  >
                    <SelectTrigger className={cn(
                      "h-10 w-full bg-card",
                      gender.touched && gender.error && "border-destructive"
                    )}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {gender.touched && gender.error && (
                    <p className="flex items-center gap-1 text-xs text-destructive" role="alert">
                      <AlertCircle className="size-3 shrink-0" />
                      {gender.error}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm text-foreground">Blood Group</Label>
                  <Select
                    value={bloodGroup.value}
                    onValueChange={(v) => setBloodGroup({ value: v, error: "", touched: true })}
                    disabled={submitted}
                  >
                    <SelectTrigger className="h-10 w-full bg-card">
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      {bloodGroups.map(bg => (
                        <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <FormInput
                  label="Birth Weight (kg)"
                  field={birthWeight}
                  setField={setBirthWeight}
                  type="number"
                  placeholder="e.g. 3.2"
                  required={false}
                />
              </div>
            </CardContent>
          </Card>

          {/* Guardian Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-500/10">
                  <User className="size-4 text-emerald-600" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <CardTitle className="text-base">Guardian / Parent Details</CardTitle>
                  <CardDescription>Primary contact information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Guardian Full Name"
                  field={guardianName}
                  setField={setGuardianName}
                  placeholder="Enter guardian name"
                  icon={User}
                />
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm text-foreground">
                    Relation<span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Select
                    value={guardianRelation.value}
                    onValueChange={(v) => setGuardianRelation({ value: v, error: "", touched: true })}
                    disabled={submitted}
                  >
                    <SelectTrigger className={cn(
                      "h-10 w-full bg-card",
                      guardianRelation.touched && guardianRelation.error && "border-destructive"
                    )}>
                      <SelectValue placeholder="Select relation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Father">Father</SelectItem>
                      <SelectItem value="Mother">Mother</SelectItem>
                      <SelectItem value="Grandfather">Grandfather</SelectItem>
                      <SelectItem value="Grandmother">Grandmother</SelectItem>
                      <SelectItem value="Legal Guardian">Legal Guardian</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {guardianRelation.touched && guardianRelation.error && (
                    <p className="flex items-center gap-1 text-xs text-destructive" role="alert">
                      <AlertCircle className="size-3 shrink-0" />
                      {guardianRelation.error}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Mobile Number"
                  field={phone}
                  setField={setPhone}
                  validationFn={validatePhone}
                  placeholder="10-digit mobile number"
                  icon={Phone}
                  maxLength={10}
                />
                <FormInput
                  label="Alternate Number"
                  field={altPhone}
                  setField={setAltPhone}
                  placeholder="Optional"
                  icon={Phone}
                  required={false}
                />
              </div>
              <FormInput
                label="Email Address"
                field={email}
                setField={setEmail}
                validationFn={validateEmail}
                type="email"
                placeholder="guardian@example.com"
                required={false}
              />
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-blue-500/10">
                  <MapPin className="size-4 text-blue-600" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <CardTitle className="text-base">Address</CardTitle>
                  <CardDescription>Residential address details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FormInput
                label="Street Address"
                field={address}
                setField={setAddress}
                placeholder="House no., Street, Area"
                icon={MapPin}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormInput
                  label="City"
                  field={city}
                  setField={setCity}
                  placeholder="City"
                />
                <FormInput
                  label="State"
                  field={state}
                  setField={setState}
                  placeholder="State"
                />
                <FormInput
                  label="Pincode"
                  field={pincode}
                  setField={setPincode}
                  validationFn={validatePincode}
                  placeholder="6-digit"
                  maxLength={6}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ──────────────────────── RIGHT COLUMN ─────────────────────── */}
        <div className="flex flex-col gap-6">

          {/* Insurance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-violet-500/10">
                  <Shield className="size-4 text-violet-600" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <CardTitle className="text-base">Insurance Details</CardTitle>
                  <CardDescription>Health insurance coverage information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={hasInsurance}
                  onClick={() => setHasInsurance(!hasInsurance)}
                  disabled={submitted}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    hasInsurance ? "bg-primary" : "bg-input"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block size-5 transform rounded-full bg-card shadow-lg ring-0 transition-transform",
                      hasInsurance ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
                <Label className="text-sm">Patient has health insurance</Label>
              </div>

              {hasInsurance && (
                <div className="flex flex-col gap-4 pt-2 border-t border-border">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm text-foreground">
                      Insurance Provider<span className="text-destructive ml-0.5">*</span>
                    </Label>
                    <Select
                      value={insuranceProvider.value}
                      onValueChange={(v) => setInsuranceProvider({ value: v, error: "", touched: true })}
                      disabled={submitted}
                    >
                      <SelectTrigger className={cn(
                        "h-10 w-full bg-card",
                        insuranceProvider.touched && insuranceProvider.error && "border-destructive"
                      )}>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {insuranceProviders.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {insuranceProvider.touched && insuranceProvider.error && (
                      <p className="flex items-center gap-1 text-xs text-destructive" role="alert">
                        <AlertCircle className="size-3 shrink-0" />
                        {insuranceProvider.error}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                      label="Policy Number"
                      field={policyNumber}
                      setField={setPolicyNumber}
                      placeholder="Policy / Claim ID"
                      icon={CreditCard}
                    />
                    <FormInput
                      label="Policy Holder Name"
                      field={policyHolder}
                      setField={setPolicyHolder}
                      placeholder="Name on policy"
                      required={false}
                    />
                  </div>
                  <FormInput
                    label="Valid Till"
                    field={validTill}
                    setField={setValidTill}
                    type="date"
                    required={false}
                    icon={CalendarDays}
                  />
                </div>
              )}

              {!hasInsurance && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted border border-border">
                  <Shield className="size-4 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    No insurance on record. Patient will be registered under self-pay.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Referral & Medical Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-amber-500/10">
                  <Heart className="size-4 text-amber-600" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <CardTitle className="text-base">Referral & Medical Notes</CardTitle>
                  <CardDescription>Source of referral and initial notes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm text-foreground">Referral Source</Label>
                  <Select
                    value={referralSource.value}
                    onValueChange={(v) => setReferralSource({ value: v, error: "", touched: true })}
                    disabled={submitted}
                  >
                    <SelectTrigger className="h-10 w-full bg-card">
                      <SelectValue placeholder="How did patient arrive?" />
                    </SelectTrigger>
                    <SelectContent>
                      {referralSources.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <FormInput
                  label="Referring Doctor"
                  field={referringDoctor}
                  setField={setReferringDoctor}
                  placeholder="Dr. name (if any)"
                  required={false}
                  icon={Building2}
                />
              </div>
              <FormInput
                label="Known Allergies"
                field={knownAllergies}
                setField={setKnownAllergies}
                placeholder="e.g. Penicillin, Sulfa drugs, None known"
                required={false}
              />
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm text-foreground">Additional Medical Notes</Label>
                <textarea
                  value={medicalNotes.value}
                  onChange={(e) => setMedicalNotes(f => ({ ...f, value: e.target.value }))}
                  disabled={submitted}
                  placeholder="Any pre-existing conditions, current medications, special instructions..."
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Upload Reports */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-cyan-500/10">
                  <FileUp className="size-4 text-cyan-600" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <CardTitle className="text-base">Upload Medical Reports</CardTitle>
                  <CardDescription>Previous reports, lab results, or referral letters</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Drop Zone */}
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-3 py-8 px-4 rounded-lg border-2 border-dashed transition-colors cursor-pointer",
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50",
                  submitted && "pointer-events-none opacity-50"
                )}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Upload medical reports"
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click() }}
              >
                <div className="flex items-center justify-center size-12 rounded-full bg-muted">
                  <Upload className="size-5 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <p className="text-sm font-medium text-foreground">
                    Drag & drop files or <span className="text-primary underline underline-offset-2">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, JPG, PNG up to 10MB each
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                  disabled={submitted}
                  aria-hidden
                />
              </div>

              {/* File List */}
              {uploadedFiles.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground">{uploadedFiles.length} file(s) selected</p>
                  {uploadedFiles.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2.5"
                    >
                      <div className="flex items-center justify-center size-8 rounded-lg bg-card border border-border shrink-0">
                        <FileText className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-medium text-foreground truncate">{f.name}</span>
                        <span className="text-xs text-muted-foreground">{f.size}</span>
                      </div>
                      <button
                        onClick={() => removeFile(f.id)}
                        disabled={submitted}
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        aria-label={`Remove ${f.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Action Buttons ──────────────────────────────────────────── */}
      <Card className="sticky bottom-0 z-20">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="size-4 shrink-0" />
            <span>
              Fields marked with <span className="text-destructive font-semibold">*</span> are mandatory
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => window.location.reload()}
              disabled={saving}
            >
              <X className="size-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="gap-1.5 min-w-[140px]"
            >
              {saving ? (
                <>
                  <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Register Patient
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
