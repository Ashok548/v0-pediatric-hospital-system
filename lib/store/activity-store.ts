// ─────────────────────────────────────────────────────────────────────────────
// lib/store/activity-store.ts
// Append-only patient activity audit log. Cross-module event bus.
// All other stores call logActivity() to record user-visible events.
// ─────────────────────────────────────────────────────────────────────────────

import { useSyncExternalStore } from "react"

export type ActivityCategory =
    | "registration"
    | "admission"
    | "discharge"
    | "billing"
    | "vitals"
    | "pharmacy"
    | "transfer"
    | "lab"
    | "prescription"

export interface ActivityLog {
    id: string
    patientId: string       // always required
    admissionId?: string    // optional, for IP-context events
    timestamp: string       // ISO
    actor: string           // e.g. "Dr. Priya Reddy", "Nurse Rekha", "System"
    category: ActivityCategory
    action: string          // short verb, e.g. "Admitted to Ward", "Bill Settled"
    details?: string        // e.g. "PICU Bed B-01 assigned"
}

let _logs: ActivityLog[] = [
    {
        id: "ACT-0001", patientId: "CN-2026-0001", admissionId: "ADM-20260225-001",
        timestamp: "2026-02-25T08:00:00Z", actor: "System", category: "registration",
        action: "Patient Registered", details: "UHID: CN-2026-0001"
    },
    {
        id: "ACT-0002", patientId: "CN-2026-0001", admissionId: "ADM-20260225-001",
        timestamp: "2026-02-25T08:10:00Z", actor: "Dr. Priya Reddy", category: "admission",
        action: "Admitted to Ward", details: "Emergency admission — PICU Bed B-01"
    },
    {
        id: "ACT-0003", patientId: "CN-2026-0001", admissionId: "ADM-20260225-001",
        timestamp: "2026-02-25T08:30:00Z", actor: "Nurse Rekha", category: "vitals",
        action: "Vitals Charted", details: "HR: 145, SpO2: 91%, Temp: 38.7°C"
    },
    {
        id: "ACT-0004", patientId: "CN-2026-0005", admissionId: "ADM-20260224-002",
        timestamp: "2026-02-24T10:30:00Z", actor: "System", category: "registration",
        action: "Patient Registered", details: "UHID: CN-2026-0005"
    },
    {
        id: "ACT-0005", patientId: "CN-2026-0005", admissionId: "ADM-20260224-002",
        timestamp: "2026-02-24T10:45:00Z", actor: "Dr. Anil Kumar", category: "admission",
        action: "Admitted to Ward", details: "Scheduled admission — General Pediatrics Bed G-01"
    },
    {
        id: "ACT-0006", patientId: "CN-2026-0009",
        timestamp: "2026-02-10T11:00:00Z", actor: "System", category: "registration",
        action: "Patient Registered", details: "UHID: CN-2026-0009"
    },
    {
        id: "ACT-0007", patientId: "CN-2026-0009", admissionId: "ADM-20260210-005",
        timestamp: "2026-02-10T11:10:00Z", actor: "Dr. Meera Iyer", category: "admission",
        action: "Admitted to Ward", details: "Scheduled admission — General Pediatrics"
    },
    {
        id: "ACT-0008", patientId: "CN-2026-0009", admissionId: "ADM-20260210-005",
        timestamp: "2026-02-18T14:00:00Z", actor: "Dr. Meera Iyer", category: "discharge",
        action: "Patient Discharged", details: "Normal discharge. Full antibiotic course completed."
    },
]

const _listeners = new Set<() => void>()

function emit() {
    _logs = [..._logs]
    _listeners.forEach(fn => fn())
}

// ─── Write ────────────────────────────────────────────────────────────────────
export function logActivity(entry: Omit<ActivityLog, "id">): void {
    const id = `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    _logs = [..._logs, { id, ...entry }]
    emit()
}

// ─── Read ─────────────────────────────────────────────────────────────────────
function getAll() {
    return _logs
}

export function getActivitiesForPatient(patientId: string): ActivityLog[] {
    return _logs
        .filter(l => l.patientId === patientId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// ─── Subscribe ────────────────────────────────────────────────────────────────
function subscribe(fn: () => void): () => void {
    _listeners.add(fn)
    return () => _listeners.delete(fn)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useActivityStore() {
    const logs = useSyncExternalStore(subscribe, getAll, getAll)
    return { logs, logActivity, getActivitiesForPatient: (id: string) => getActivitiesForPatient(id) }
}

export function usePatientActivity(patientId: string): ActivityLog[] {
    const logs = useSyncExternalStore(subscribe, getAll, getAll)
    return logs
        .filter(l => l.patientId === patientId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}
