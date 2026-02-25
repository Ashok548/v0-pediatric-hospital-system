// ─────────────────────────────────────────────────────────────────────────────
// lib/store/patients.ts
// Client-side mutable patient store.
// Used by registration (write), discharge (status update), and NICU (transfer).
// Replace with API calls when backend is ready.
// ─────────────────────────────────────────────────────────────────────────────

import type { Patient, PatientDetail, PatientStatus } from "@/lib/data/types"
import {
    patients as _basePts,
    patientDetails as _baseDets,
} from "@/lib/data/patients"

// Mutable in-memory store — module-level singleton (same session)
let _patients: Patient[] = [..._basePts]
let _patientDetails: Record<string, PatientDetail> = { ..._baseDets }

const _listeners = new Set<() => void>()

// ─── Read ─────────────────────────────────────────────────────────────────────
export function getPatients(): Patient[] {
    return _patients
}

export function getPatientDetail(uhid: string): PatientDetail | undefined {
    return _patientDetails[uhid]
}

export function getAllPatientDetails(): Record<string, PatientDetail> {
    return _patientDetails
}

// ─── Write ────────────────────────────────────────────────────────────────────
export function addPatient(patient: Patient, detail: PatientDetail) {
    _patients = [patient, ..._patients]
    _patientDetails = { ..._patientDetails, [patient.uhid]: detail }
    _notify()
}

export function updatePatientStatus(
    uhid: string,
    status: PatientStatus,
    wardBed?: string
) {
    _patients = _patients.map(p =>
        p.uhid === uhid
            ? { ...p, status, wardBed: wardBed ?? p.wardBed, lastModified: new Date() }
            : p
    )
    if (_patientDetails[uhid]) {
        _patientDetails = {
            ..._patientDetails,
            [uhid]: {
                ..._patientDetails[uhid],
                status,
                ...(wardBed !== undefined ? { wardBed } : {}),
            },
        }
    }
    _notify()
}

export function admitToWard(
    uhid: string,
    wardBed: string,
    doctor: string,
    diagnosis: string,
    admissionDate: string
) {
    _patients = _patients.map(p =>
        p.uhid === uhid
            ? { ...p, status: "IP", wardBed, doctor, lastModified: new Date() }
            : p
    )
    if (_patientDetails[uhid]) {
        _patientDetails = {
            ..._patientDetails,
            [uhid]: {
                ..._patientDetails[uhid],
                status: "IP",
                wardBed,
                doctor,
                diagnosis,
                admissionDate
            },
        }
    }
    _notify()
}

// ─── Subscribe ────────────────────────────────────────────────────────────────
export function subscribe(fn: () => void): () => void {
    _listeners.add(fn)
    return () => _listeners.delete(fn)
}

function _notify() {
    _listeners.forEach(fn => fn())
}

// ─── UHID generator ───────────────────────────────────────────────────────────
export function generateUHID(): string {
    const year = new Date().getFullYear()
    const seq = String(_patients.length + 1).padStart(4, "0")
    return `CN-${year}-${seq}`
}
