import type { ApiAdmission } from "@/lib/types/admission"
import type { ApiGrowthRecord, ApiNicuVitals } from "@/lib/types/nicu"
import type { OPVisit } from "@/lib/api/op-visits"
import type { ApiConsultation } from "@/lib/api/consultations"
import type { ApiPrescription } from "@/lib/api/pharmacy"
import type { ApiPatientDetail } from "@/lib/api/patients"
import type { ApiServiceOrder } from "@/lib/api/service-orders"
import { getLabOrderStatusLabel } from "@/lib/utils/lab-order-status"

export type PatientHubApiPatient = ApiPatientDetail

export interface PatientHubVaccination {
    id: string
    vaccineName: string
    ageLabel: string
    status: string
    scheduledDate?: string | null
    administeredAt?: string | null
    administeredDate?: string | null
}

export interface PatientHubApiInput {
    patientId: string
    patient: PatientHubApiPatient | null
    admissions: ApiAdmission[]
    opVisits: OPVisit[]
    consultations: ApiConsultation[]
    prescriptions: ApiPrescription[]
    labOrders: Array<{
        id: string
        orderNumber: string
        status: string
        orderDate: string
        patientType?: string
        panels?: Array<{ id: string; panelName: string }>
    }>
    serviceOrders: ApiServiceOrder[]
    vaccinations: PatientHubVaccination[]
    growthRecords: ApiGrowthRecord[]
    nicuVitals?: ApiNicuVitals[]
}

export type PatientHubTone = "neutral" | "success" | "warning" | "danger" | "info"

export type PatientHubIconKey =
    | "alert"
    | "growth"
    | "visit"
    | "admission"
    | "prescription"
    | "consultation"
    | "vaccine"
    | "lab"
    | "service"

export type PatientHubOpStatus = "ACTIVE" | "COMPLETED" | "CANCELLED" | "ER" | "UNKNOWN"

export interface PatientHubHeaderContext {
    label: string
    title: string
    detail: string | null
    tone: PatientHubTone
}

export interface PatientHubHeader {
    fullName: string
    uhid: string
    patientStatus: "active" | "inactive"
    patientStatusLabel: string
    avatarTone: "female" | "newborn" | "default"
    ageLabel: string
    ageMonths: number
    dobLabel: string
    genderLabel: string
    bloodGroup: string | null
    guardianLabel: string
    phone: string | null
    guardianPhone: string | null
    email: string | null
    addressLine: string | null
    abhaId: string | null
    registeredLabel: string
    admissionsCount: number
    activeAdmission: PatientHubHeaderContext | null
    activeVisit: PatientHubHeaderContext | null
}

export interface PatientHubClinicalItem {
    key: string
    label: string
    tone: PatientHubTone
    source: "patient" | "growth" | "vaccination" | "prescription"
}

export interface PatientHubInsightItem {
    key: string
    title: string
    detail: string
    tone: PatientHubTone
    iconKey: PatientHubIconKey
    source: "growth" | "vaccination" | "visit" | "admission" | "prescription" | "vitals"
    isGap?: boolean
}

export interface PatientHubGrowthMetric {
    key: "weight" | "height" | "head-circumference"
    label: string
    value: string
    hint?: string | null
}

export interface PatientHubGrowth {
    hasData: boolean
    recordedAtLabel: string | null
    ageAtRecordLabel: string | null
    metrics: PatientHubGrowthMetric[]
    percentileLabel: string | null
    percentileDetail: string | null
    percentileTone: PatientHubTone
    underweight: boolean
}

export interface PatientHubTimelineItem {
    id: string
    type: "visit" | "consultation" | "prescription" | "admission" | "vaccine" | "lab" | "service"
    title: string
    subtitle: string
    occurredAt: string
    occurredAtLabel: string
    badge?: string
    tone: PatientHubTone
    iconKey: PatientHubIconKey
}

export interface PatientHubCta {
    label: string
    href: string
    state: "start" | "continue"
    supportingText: string | null
    disabled: boolean
}

export interface PatientHubViewModel {
    header: PatientHubHeader
    clinicalSummary: PatientHubClinicalItem[]
    insights: PatientHubInsightItem[]
    growth: PatientHubGrowth
    timeline: PatientHubTimelineItem[]
    cta: PatientHubCta
}

export const PATIENT_HUB_API_GAPS = [
    {
        key: "general-pediatric-vitals",
        section: "insights",
        reason: "General pediatric vitals are not currently fetched for the Patient Hub. Only NICU admission vitals are available.",
    },
    {
        key: "patient-critical-alerts",
        section: "insights",
        reason: "There is no patient-level critical alert feed for the hub outside NICU-specific alerts.",
    },
] as const

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

function formatDate(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
}

function formatDateTime(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

function calcAgeDisplay(dateOfBirth: string): string {
    const dob = new Date(dateOfBirth)
    const now = new Date()
    let years = now.getFullYear() - dob.getFullYear()
    let months = now.getMonth() - dob.getMonth()
    let days = now.getDate() - dob.getDate()

    if (days < 0) {
        months -= 1
        days += 30
    }
    if (months < 0) {
        years -= 1
        months += 12
    }
    if (years === 0 && months === 0) return `${days} days`
    if (years === 0) return `${months} month${months !== 1 ? "s" : ""}`
    return `${years}y ${months}mo`
}

function calcAgeInMonths(dateOfBirth: string): number {
    const dob = new Date(dateOfBirth)
    const now = new Date()
    return (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth())
}

function sortByDateDesc<T>(items: T[], getDate: (item: T) => string | null | undefined): T[] {
    return [...items].sort((left, right) => {
        const leftTs = getDate(left) ? new Date(getDate(left) as string).getTime() : 0
        const rightTs = getDate(right) ? new Date(getDate(right) as string).getTime() : 0
        return rightTs - leftTs
    })
}

function normalizeOpStatus(status: OPVisit["status"]): PatientHubOpStatus {
    if (["REGISTERED", "TRIAGED", "PRE_CONSULT", "CONSULTING", "ORDERS_PLACED", "IN_PROGRESS"].includes(status)) {
        return "ACTIVE"
    }
    if (["COMPLETED", "BILLED"].includes(status)) {
        return "COMPLETED"
    }
    if (status === "CANCELLED") {
        return "CANCELLED"
    }
    if (status === "CONVERTED_TO_ER") {
        return "ER"
    }
    return "UNKNOWN"
}

function normalizeVaccinationStatus(status: string): "DUE" | "MISSED" | "COMPLETED" | "PENDING" | "UPCOMING" | "UNKNOWN" {
    const normalized = status.toUpperCase()
    if (["DUE", "MISSED", "COMPLETED", "PENDING", "UPCOMING"].includes(normalized)) {
        return normalized as "DUE" | "MISSED" | "COMPLETED" | "PENDING" | "UPCOMING"
    }
    return "UNKNOWN"
}

function normalizePrescriptionStatus(status: ApiPrescription["status"]): "ACTIVE" | "CLOSED" {
    return status === "PENDING" || status === "PARTIAL" ? "ACTIVE" : "CLOSED"
}

function formatStatusLabel(status: string | null | undefined): string | undefined {
    if (!status) return undefined
    return status
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
}

function getWhoWeightReference(ageMonths: number) {
    if (ageMonths < 0 || ageMonths > 24) return null
    return WHO_WEIGHT_BOYS.reduce((closest, current) => {
        const currentDiff = Math.abs(current.month - ageMonths)
        const closestDiff = Math.abs(closest.month - ageMonths)
        return currentDiff < closestDiff ? current : closest
    })
}

function getWeightPercentileMeta(weight: number, ageMonths: number) {
    const reference = getWhoWeightReference(ageMonths)
    if (!reference) {
        return {
            label: null,
            detail: null,
            underweight: false,
            tone: "neutral" as PatientHubTone,
        }
    }

    if (weight < reference.p3) {
        return {
            label: "<3rd %ile",
            detail: `WHO 3rd percentile at ${reference.month} mo is ${reference.p3.toFixed(1)} kg`,
            underweight: true,
            tone: "danger" as PatientHubTone,
        }
    }
    if (weight < reference.p15) {
        return {
            label: "3rd-15th %ile",
            detail: `Tracks below median for ${reference.month} mo`,
            underweight: false,
            tone: "warning" as PatientHubTone,
        }
    }
    if (weight < reference.p85) {
        return {
            label: weight < reference.p50 ? "15th-50th %ile" : "50th-85th %ile",
            detail: `Within expected range for ${reference.month} mo`,
            underweight: false,
            tone: "success" as PatientHubTone,
        }
    }
    if (weight < reference.p97) {
        return {
            label: "85th-97th %ile",
            detail: `Above median for ${reference.month} mo`,
            underweight: false,
            tone: "info" as PatientHubTone,
        }
    }

    return {
        label: ">=97th %ile",
        detail: `Above WHO 97th percentile for ${reference.month} mo`,
        underweight: false,
        tone: "info" as PatientHubTone,
    }
}

function makeEmptyViewModel(patientId: string): PatientHubViewModel {
    return {
        header: {
            fullName: "Unknown Patient",
            uhid: "",
            patientStatus: "inactive",
            patientStatusLabel: "Inactive",
            avatarTone: "default",
            ageLabel: "",
            ageMonths: 0,
            dobLabel: "",
            genderLabel: "",
            bloodGroup: null,
            guardianLabel: "",
            phone: null,
            guardianPhone: null,
            email: null,
            addressLine: null,
            abhaId: null,
            registeredLabel: "",
            admissionsCount: 0,
            activeAdmission: null,
            activeVisit: null,
        },
        clinicalSummary: [],
        insights: [],
        growth: {
            hasData: false,
            recordedAtLabel: null,
            ageAtRecordLabel: null,
            metrics: [
                { key: "weight", label: "Weight", value: "Not recorded" },
                { key: "height", label: "Height", value: "Not recorded" },
                { key: "head-circumference", label: "Head Circumference", value: "Not recorded" },
            ],
            percentileLabel: null,
            percentileDetail: null,
            percentileTone: "neutral",
            underweight: false,
        },
        timeline: [],
        cta: {
            label: "Start Consultation",
            href: `/patients/${patientId}/prescription`,
            state: "start",
            supportingText: null,
            disabled: false,
        },
    }
}

export function mapPatientHubData(api: PatientHubApiInput): PatientHubViewModel {
    if (!api.patient) {
        return makeEmptyViewModel(api.patientId)
    }

    const fullName = `${api.patient.firstName} ${api.patient.lastName}`
    const ageLabel = calcAgeDisplay(api.patient.dateOfBirth)
    const ageMonths = calcAgeInMonths(api.patient.dateOfBirth)
    const dobLabel = formatDate(api.patient.dateOfBirth) ?? ""
    const genderLabel = api.patient.gender === "MALE" ? "Male" : api.patient.gender === "FEMALE" ? "Female" : "Other"
    const addressLine = [api.patient.address, api.patient.city, api.patient.state, api.patient.pincode].filter(Boolean).join(", ") || null

    const sortedAdmissions = sortByDateDesc(api.admissions, (item) => item.dischargeDate ?? item.admissionDate)
    const activeAdmission = api.admissions.find((entry) => entry.status === "ADMITTED" || entry.status === "BED_ASSIGNED") ?? null
    const latestAdmission = sortedAdmissions[0] ?? null

    const sortedVisits = sortByDateDesc(api.opVisits, (item) => item.visitDate)
    const activeVisit = sortedVisits.find((visit) => normalizeOpStatus(visit.status) === "ACTIVE") ?? null
    const latestVisit = sortedVisits[0] ?? null

    const sortedConsultations = sortByDateDesc(api.consultations, (item) => item.signedAt ?? item.createdAt)
    const latestConsultation = sortedConsultations[0] ?? null
    const draftConsultation = sortedConsultations.find((item) => item.status === "DRAFT") ?? null

    const sortedPrescriptions = sortByDateDesc(api.prescriptions, (item) => item.orderedAt)
    const latestPrescription = sortedPrescriptions[0] ?? null
    const hasActivePrescription = api.prescriptions.some((item) => normalizePrescriptionStatus(item.status) === "ACTIVE")
    const sortedLabOrders = sortByDateDesc(api.labOrders, (item) => item.orderDate)
    const latestLabOrder = sortedLabOrders[0] ?? null
    const sortedServiceOrders = sortByDateDesc(api.serviceOrders, (item) => item.orderDate)
    const latestServiceOrder = sortedServiceOrders[0] ?? null

    const vaccinations = api.vaccinations.map((item) => ({
        ...item,
        normalizedStatus: normalizeVaccinationStatus(item.status),
    }))
    const overdueVaccines = vaccinations.filter((item) => item.normalizedStatus === "DUE" || item.normalizedStatus === "MISSED")
    const completedVaccines = sortByDateDesc(
        vaccinations.filter((item) => item.normalizedStatus === "COMPLETED"),
        (item) => item.administeredAt ?? item.administeredDate ?? item.scheduledDate,
    )

    const sortedGrowthRecords = sortByDateDesc(api.growthRecords, (item) => item.recordedAt)
    const latestGrowth = sortedGrowthRecords[0] ?? null
    const percentile = latestGrowth?.weight != null
        ? getWeightPercentileMeta(Number(latestGrowth.weight), latestGrowth.ageMonths)
        : { label: null, detail: null, underweight: false, tone: "neutral" as PatientHubTone }

    const criticalVitals = sortByDateDesc(
        (api.nicuVitals ?? []).filter((item) => item.isCritical),
        (item) => item.recordedAt,
    )[0] ?? null

    const header: PatientHubHeader = {
        fullName,
        uhid: api.patient.uhid,
        patientStatus: api.patient.status === "ACTIVE" ? "active" : "inactive",
        patientStatusLabel: api.patient.status === "ACTIVE" ? "Active" : "Inactive",
        avatarTone: api.patient.gender === "FEMALE" ? "female" : ageMonths <= 1 ? "newborn" : "default",
        ageLabel,
        ageMonths,
        dobLabel,
        genderLabel,
        bloodGroup: api.patient.bloodGroup ?? null,
        guardianLabel: `${api.patient.guardianName ?? ""}${api.patient.guardianRelationship ? ` (${api.patient.guardianRelationship})` : ""}`,
        phone: api.patient.phone ?? null,
        guardianPhone: api.patient.guardianPhone ?? null,
        email: api.patient.email ?? null,
        addressLine,
        abhaId: api.patient.abhaId ?? null,
        registeredLabel: formatDate(api.patient.createdAt) ?? "",
        admissionsCount: api.admissions.length,
        activeAdmission: activeAdmission ? {
            label: "Admission Active",
            title: activeAdmission.department,
            detail: activeAdmission.currentBed
                ? `${activeAdmission.currentBed.ward.name} / Bed ${activeAdmission.currentBed.bedNumber}`
                : activeAdmission.admissionNumber,
            tone: "info",
        } : null,
        activeVisit: activeVisit ? {
            label: "Current Visit",
            title: "OP Active",
            detail: `${activeVisit.opNumber}${activeVisit.appointment?.token ? ` · Token ${activeVisit.appointment.token}` : ""}`,
            tone: "success",
        } : null,
    }

    const clinicalSummary: PatientHubClinicalItem[] = []
    if (percentile.underweight) {
        clinicalSummary.push({
            key: "underweight",
            label: "Underweight (WHO <3%)",
            tone: "danger",
            source: "growth",
        })
    }
    if (overdueVaccines.length > 0) {
        clinicalSummary.push({
            key: "vaccines-due",
            label: "Vaccination Due",
            tone: "warning",
            source: "vaccination",
        })
    }
    if (!latestGrowth) {
        clinicalSummary.push({
            key: "no-growth",
            label: "No Growth Chart",
            tone: "info",
            source: "growth",
        })
    }
    if (!hasActivePrescription) {
        clinicalSummary.push({
            key: "no-active-prescription",
            label: "No Active Prescription",
            tone: "neutral",
            source: "prescription",
        })
    }

    const insights: PatientHubInsightItem[] = []
    if (!latestGrowth && ageMonths <= 24) {
        insights.push({
            key: "growth-missing",
            title: "Growth monitoring missing",
            detail: `No weight, height, or head circumference has been recorded for this ${ageMonths}-month-old child.`,
            tone: "success",
            iconKey: "growth",
            source: "growth",
        })
    }

    if (overdueVaccines.length > 0) {
        const dueNames = overdueVaccines.slice(0, 2).map((item) => item.vaccineName).join(", ")
        insights.push({
            key: "vaccines-overdue",
            title: "Vaccines need review",
            detail: `${overdueVaccines.length} vaccine${overdueVaccines.length !== 1 ? "s are" : " is"} due${dueNames ? `, including ${dueNames}` : ""}.`,
            tone: "warning",
            iconKey: "vaccine",
            source: "vaccination",
        })
    }

    if (activeVisit) {
        const triageText = activeVisit.triageLevel
            ? `Triage ${activeVisit.triageLevel}${activeVisit.triageNotes ? ` · ${activeVisit.triageNotes}` : ""}`
            : `Status ${normalizeOpStatus(activeVisit.status)}`
        insights.push({
            key: "active-visit",
            title: "Current OP encounter in progress",
            detail: `${activeVisit.opNumber} · ${triageText}`,
            tone: "success",
            iconKey: "visit",
            source: "visit",
        })
    }

    if (activeAdmission) {
        insights.push({
            key: "admission-context",
            title: "Admission context available",
            detail: `${activeAdmission.department}${activeAdmission.currentBed ? ` · ${activeAdmission.currentBed.ward.name} / Bed ${activeAdmission.currentBed.bedNumber}` : ""}`,
            tone: "info",
            iconKey: "admission",
            source: "admission",
        })
    }

    if (!hasActivePrescription) {
        insights.push({
            key: "no-active-prescription",
            title: "No active prescription linked",
            detail: activeVisit
                ? "No pending or partial prescription is present for the current clinical episode."
                : "No pending or partial prescription is currently visible for this patient.",
            tone: "neutral",
            iconKey: "prescription",
            source: "prescription",
        })
    }

    if (criticalVitals) {
        insights.push({
            key: "critical-vitals",
            title: "Critical vitals recorded",
            detail: criticalVitals.alertMessage ?? `Critical vitals recorded at ${formatDateTime(criticalVitals.recordedAt) ?? "latest measurement"}.`,
            tone: "danger",
            iconKey: "alert",
            source: "vitals",
        })
    }

    const growth: PatientHubGrowth = latestGrowth ? {
        hasData: true,
        recordedAtLabel: formatDate(latestGrowth.recordedAt),
        ageAtRecordLabel: `${latestGrowth.ageMonths} mo`,
        metrics: [
            {
                key: "weight",
                label: "Weight",
                value: latestGrowth.weight != null ? `${Number(latestGrowth.weight).toFixed(1)} kg` : "Not recorded",
                hint: percentile.label,
            },
            {
                key: "height",
                label: "Height",
                value: latestGrowth.height != null ? `${Number(latestGrowth.height).toFixed(1)} cm` : "Not recorded",
            },
            {
                key: "head-circumference",
                label: "Head Circumference",
                value: latestGrowth.headCircumference != null ? `${Number(latestGrowth.headCircumference).toFixed(1)} cm` : "Not recorded",
            },
        ],
        percentileLabel: percentile.label,
        percentileDetail: percentile.detail,
        percentileTone: percentile.tone,
        underweight: percentile.underweight,
    } : {
        hasData: false,
        recordedAtLabel: null,
        ageAtRecordLabel: null,
        metrics: [
            { key: "weight", label: "Weight", value: "Not recorded" },
            { key: "height", label: "Height", value: "Not recorded" },
            { key: "head-circumference", label: "Head Circumference", value: "Not recorded" },
        ],
        percentileLabel: null,
        percentileDetail: null,
        percentileTone: "neutral",
        underweight: false,
    }

    const timeline: PatientHubTimelineItem[] = []
    if (latestVisit) {
        timeline.push({
            id: `visit-${latestVisit.id}`,
            type: "visit",
            title: activeVisit?.id === latestVisit.id ? "OP Started" : "Last OP Visit",
            subtitle: `${latestVisit.opNumber} · ${latestVisit.department}${latestVisit.appointment?.token ? ` · Token ${latestVisit.appointment.token}` : ""}`,
            occurredAt: latestVisit.visitDate,
            occurredAtLabel: formatDateTime(latestVisit.visitDate) ?? "",
            badge: normalizeOpStatus(latestVisit.status),
            tone: "success",
            iconKey: "visit",
        })
    }

    if (latestConsultation) {
        const consultationDate = latestConsultation.signedAt ?? latestConsultation.createdAt
        timeline.push({
            id: `consultation-${latestConsultation.id}`,
            type: "consultation",
            title: latestConsultation.status === "DRAFT" ? "Consultation Draft" : "Last Consultation",
            subtitle: latestConsultation.diagnosis || latestConsultation.chiefComplaint || latestConsultation.plan || "Clinical note updated",
            occurredAt: consultationDate,
            occurredAtLabel: formatDateTime(consultationDate) ?? "",
            badge: formatStatusLabel(latestConsultation.status),
            tone: "neutral",
            iconKey: "consultation",
        })
    }

    if (latestPrescription) {
        timeline.push({
            id: `prescription-${latestPrescription.id}`,
            type: "prescription",
            title: "Last Prescription",
            subtitle: `${latestPrescription.prescriptionNumber} · ${latestPrescription.items.length} item${latestPrescription.items.length !== 1 ? "s" : ""}${latestPrescription.doctor?.name ? ` · Dr. ${latestPrescription.doctor.name}` : ""}`,
            occurredAt: latestPrescription.orderedAt,
            occurredAtLabel: formatDateTime(latestPrescription.orderedAt) ?? "",
            badge: formatStatusLabel(latestPrescription.status),
            tone: "info",
            iconKey: "prescription",
        })
    }

    if (latestLabOrder) {
        const panelSummary = latestLabOrder.panels?.slice(0, 2).map((panel) => panel.panelName).join(", ")
        timeline.push({
            id: `lab-${latestLabOrder.id}`,
            type: "lab",
            title: "Latest Lab Order",
            subtitle: `${latestLabOrder.orderNumber}${panelSummary ? ` · ${panelSummary}` : ""}`,
            occurredAt: latestLabOrder.orderDate,
            occurredAtLabel: formatDateTime(latestLabOrder.orderDate) ?? "",
            badge: getLabOrderStatusLabel(latestLabOrder.status),
            tone: latestLabOrder.status === "VERIFIED" ? "success" : "warning",
            iconKey: "lab",
        })
    }

    if (latestServiceOrder) {
        timeline.push({
            id: `service-${latestServiceOrder.id}`,
            type: "service",
            title: "Latest Service Order",
            subtitle: `${latestServiceOrder.orderNumber} · ${latestServiceOrder.service.name}`,
            occurredAt: latestServiceOrder.orderDate,
            occurredAtLabel: formatDateTime(latestServiceOrder.orderDate) ?? "",
            badge: formatStatusLabel(latestServiceOrder.status),
            tone: latestServiceOrder.status === "COMPLETED" ? "success" : "info",
            iconKey: "service",
        })
    }

    if (latestAdmission) {
        const occurredAt = latestAdmission.dischargeDate ?? latestAdmission.admissionDate
        timeline.push({
            id: `admission-${latestAdmission.id}`,
            type: "admission",
            title: latestAdmission.status === "DISCHARGED" ? "Last Discharge" : "Admission Update",
            subtitle: `${latestAdmission.admissionNumber} · ${latestAdmission.department}`,
            occurredAt,
            occurredAtLabel: formatDateTime(occurredAt) ?? "",
            badge: formatStatusLabel(latestAdmission.status),
            tone: latestAdmission.status === "DISCHARGED" ? "neutral" : "info",
            iconKey: "admission",
        })
    }

    if (completedVaccines[0]) {
        const vaccine = completedVaccines[0]
        const occurredAt = vaccine.administeredAt ?? vaccine.administeredDate ?? vaccine.scheduledDate ?? new Date().toISOString()
        timeline.push({
            id: `vaccine-${vaccine.id}`,
            type: "vaccine",
            title: "Last Vaccination",
            subtitle: `${vaccine.vaccineName} · ${vaccine.ageLabel}`,
            occurredAt,
            occurredAtLabel: formatDateTime(occurredAt) ?? "",
            badge: formatStatusLabel(vaccine.normalizedStatus),
            tone: "warning",
            iconKey: "vaccine",
        })
    }

    const cta: PatientHubCta = {
        label: activeVisit ? "Continue Consultation" : "Start Consultation",
        href: `/patients/${api.patientId}/prescription`,
        state: activeVisit ? "continue" : "start",
        supportingText: activeVisit
            ? `${activeVisit.opNumber} is active`
            : draftConsultation
                ? "Draft consultation exists, but no active OP visit is open."
                : null,
        disabled: false,
    }

    return {
        header,
        clinicalSummary: clinicalSummary.slice(0, 4),
        insights: insights.slice(0, 4),
        growth,
        timeline: sortByDateDesc(timeline, (item) => item.occurredAt).slice(0, 5),
        cta,
    }
}