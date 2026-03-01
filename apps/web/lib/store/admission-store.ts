// ─────────────────────────────────────────────────────────────────────────────
// lib/store/admission-store.ts
// Mutable singleton wrapping mockAdmissions.
// Extends discharge with a full multi-department clearance workflow.
// ─────────────────────────────────────────────────────────────────────────────

import { useSyncExternalStore } from "react"
import { mockAdmissions, AdmissionStatus, DischargeType, type Admission } from "../data/admissions"
import { updatePatientStatus } from "./patients"
import { logActivity } from "./activity-store"
import { billingActions } from "./billing-store"
import { BillWorkflowStatus } from "../types/billing"

// ─── Extended Discharge Clearance Type ───────────────────────────────────────
// Augments the existing 'any' discharge field in admissions.ts
export interface DischargeClearance {
    status: "in_progress" | "completed"
    type?: DischargeType
    clinicalCleared: boolean
    clinicalNote?: string
    clinicalClearedAt?: string
    clinicalClearedBy?: string
    pharmacyCleared: boolean
    pharmacyClearedAt?: string
    pharmacyClearedBy?: string
    billingCleared: boolean
    billingClearedAt?: string
    billingClearedBy?: string
    finalizedAt?: string
    finalSummary?: string
}

// ─── State ────────────────────────────────────────────────────────────────────
let _admissions: Admission[] = [...mockAdmissions]
const _listeners = new Set<() => void>()

function emit() {
    _admissions = [..._admissions]
    _listeners.forEach(fn => fn())
}
function subscribe(fn: () => void) {
    _listeners.add(fn)
    return () => _listeners.delete(fn)
}
function getSnapshot() { return _admissions }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function update(id: string, patch: Partial<Admission>): void {
    _admissions = _admissions.map(a => a.id === id ? { ...a, ...patch } : a)
    emit()
}

// ─── Selectors ────────────────────────────────────────────────────────────────
export function getAdmissionById(id: string): Admission | undefined {
    return _admissions.find(a => a.id === id)
}

export function getAdmittedAdmissions(): Admission[] {
    return _admissions.filter(a => a.status === AdmissionStatus.ADMITTED || a.status === AdmissionStatus.BED_ASSIGNED)
}

// ─── Discharge Clearance Actions ──────────────────────────────────────────────

export function initiateDischargeClearance(admissionId: string): void {
    const adm = getAdmissionById(admissionId)
    if (!adm) return
    const clearance: DischargeClearance = {
        status: "in_progress",
        clinicalCleared: false,
        pharmacyCleared: false,
        billingCleared: false,
    }
    update(admissionId, { discharge: clearance })
    logActivity({
        patientId: adm.patientId,
        admissionId,
        timestamp: new Date().toISOString(),
        actor: "System",
        category: "discharge",
        action: "Discharge Initiated",
        details: "Multi-departmental clearance process started",
    })
}

export function setClinicalClearance(
    admissionId: string,
    note: string,
    clearedBy: string
): void {
    const adm = getAdmissionById(admissionId)
    if (!adm?.discharge) return
    const clearance: DischargeClearance = {
        ...(adm.discharge as DischargeClearance),
        clinicalCleared: true,
        clinicalNote: note,
        clinicalClearedAt: new Date().toISOString(),
        clinicalClearedBy: clearedBy,
    }
    update(admissionId, { discharge: clearance })
    logActivity({
        patientId: adm.patientId,
        admissionId,
        timestamp: new Date().toISOString(),
        actor: clearedBy,
        category: "discharge",
        action: "Clinical Clearance Granted",
        details: note,
    })
}

export function setPharmacyClearance(admissionId: string, clearedBy: string): void {
    const adm = getAdmissionById(admissionId)
    if (!adm?.discharge) return
    const clearance: DischargeClearance = {
        ...(adm.discharge as DischargeClearance),
        pharmacyCleared: true,
        pharmacyClearedAt: new Date().toISOString(),
        pharmacyClearedBy: clearedBy,
    }
    update(admissionId, { discharge: clearance })
    logActivity({
        patientId: adm.patientId,
        admissionId,
        timestamp: new Date().toISOString(),
        actor: clearedBy,
        category: "discharge",
        action: "Pharmacy Clearance Granted",
        details: "No pending medications",
    })
}

export function setBillingClearance(admissionId: string, clearedBy: string): void {
    const adm = getAdmissionById(admissionId)
    if (!adm?.discharge) return

    // Check billing — initiate settlement if bill still running
    billingActions.initiateSettlement(admissionId)

    const clearance: DischargeClearance = {
        ...(adm.discharge as DischargeClearance),
        billingCleared: true,
        billingClearedAt: new Date().toISOString(),
        billingClearedBy: clearedBy,
    }
    update(admissionId, { discharge: clearance })
    logActivity({
        patientId: adm.patientId,
        admissionId,
        timestamp: new Date().toISOString(),
        actor: clearedBy,
        category: "discharge",
        action: "Billing Clearance Granted",
        details: "Account settled / cleared for discharge",
    })
}

export function finalizeDischarge(
    admissionId: string,
    type: DischargeType,
    summary: string,
    finalizedBy: string
): { success: boolean; error?: string } {
    const adm = getAdmissionById(admissionId)
    if (!adm?.discharge) return { success: false, error: "No discharge in progress" }

    const dc = adm.discharge as DischargeClearance
    if (!dc.clinicalCleared) return { success: false, error: "Clinical clearance pending" }
    if (!dc.pharmacyCleared) return { success: false, error: "Pharmacy clearance pending" }
    if (!dc.billingCleared) return { success: false, error: "Billing clearance pending" }

    const finalClearance: DischargeClearance = {
        ...dc,
        status: "completed",
        type,
        finalizedAt: new Date().toISOString(),
        finalSummary: summary,
    }
    update(admissionId, {
        status: AdmissionStatus.DISCHARGED,
        discharge: finalClearance,
        currentLocation: undefined,
    })

    // Update patient status
    updatePatientStatus(adm.patientId, "Discharged")

    logActivity({
        patientId: adm.patientId,
        admissionId,
        timestamp: new Date().toISOString(),
        actor: finalizedBy,
        category: "discharge",
        action: "Patient Discharged",
        details: `Type: ${type}. ${summary}`,
    })

    return { success: true }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAdmissionStore() {
    const admissions = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
    return {
        admissions,
        admitted: admissions.filter(a => a.status === AdmissionStatus.ADMITTED || a.status === AdmissionStatus.BED_ASSIGNED),
        getAdmissionById: (id: string) => admissions.find(a => a.id === id),
        initiateDischargeClearance,
        setClinicalClearance,
        setPharmacyClearance,
        setBillingClearance,
        finalizeDischarge,
    }
}
