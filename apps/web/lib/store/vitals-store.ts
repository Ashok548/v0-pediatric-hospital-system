// ─────────────────────────────────────────────────────────────────────────────
// lib/store/vitals-store.ts
// In-memory store for Nursing Vitals and I/O charting per admission.
// Calls logActivity for audit trail.
// ─────────────────────────────────────────────────────────────────────────────

import { useSyncExternalStore } from "react"
import type { VitalReading, IOEntry } from "../data/vitals"
import { mockVitalReadings, mockIOEntries } from "../data/vitals"
import { logActivity } from "./activity-store"

// ─── State ────────────────────────────────────────────────────────────────────
let _vitals: VitalReading[] = [...mockVitalReadings]
let _io: IOEntry[] = [...mockIOEntries]

const _listeners = new Set<() => void>()
function emit() {
    _vitals = [..._vitals]
    _io = [..._io]
    _listeners.forEach(fn => fn())
}
function subscribe(fn: () => void) {
    _listeners.add(fn)
    return () => _listeners.delete(fn)
}

// ─── Selectors ────────────────────────────────────────────────────────────────
function getVitals() { return _vitals }
function getIO() { return _io }

export function getVitalsForAdmission(admissionId: string): VitalReading[] {
    return _vitals
        .filter(v => v.admissionId === admissionId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

export function getIOForAdmission(admissionId: string): IOEntry[] {
    return _io
        .filter(e => e.admissionId === admissionId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

export function getLatestVital(admissionId: string): VitalReading | undefined {
    const sorted = getVitalsForAdmission(admissionId)
    return sorted[sorted.length - 1]
}

// ─── Actions ──────────────────────────────────────────────────────────────────
export function addVitalReading(
    admissionId: string,
    patientId: string,
    reading: Omit<VitalReading, "id" | "admissionId">
): void {
    const newReading: VitalReading = {
        id: `VIT-${Date.now()}`,
        admissionId,
        ...reading,
    }
    _vitals = [..._vitals, newReading]
    emit()
    logActivity({
        patientId,
        admissionId,
        timestamp: reading.timestamp,
        actor: reading.recordedBy,
        category: "vitals",
        action: "Vitals Charted",
        details: `HR: ${reading.heartRate} bpm, SpO2: ${reading.spo2}%, Temp: ${reading.temperature}°C`,
    })
}

export function addIOEntry(
    admissionId: string,
    patientId: string,
    entry: Omit<IOEntry, "id" | "admissionId">
): void {
    const newEntry: IOEntry = {
        id: `IO-${Date.now()}`,
        admissionId,
        ...entry,
    }
    _io = [..._io, newEntry]
    emit()
    logActivity({
        patientId,
        admissionId,
        timestamp: entry.timestamp,
        actor: entry.recordedBy,
        category: "vitals",
        action: `I/O Entry — ${entry.ioType === "intake" ? "Intake" : "Output"}`,
        details: `${entry.route}: ${entry.volumeMl} mL`,
    })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useVitalsStore(admissionId: string) {
    const allVitals = useSyncExternalStore(subscribe, getVitals, getVitals)
    const allIO = useSyncExternalStore(subscribe, getIO, getIO)

    const vitals = allVitals
        .filter(v => v.admissionId === admissionId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    const io = allIO
        .filter(e => e.admissionId === admissionId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    const totalIntake = io.filter(e => e.ioType === "intake").reduce((sum, e) => sum + e.volumeMl, 0)
    const totalOutput = io.filter(e => e.ioType === "output").reduce((sum, e) => sum + e.volumeMl, 0)

    return {
        vitals,
        io,
        totalIntake,
        totalOutput,
        ioBalance: totalIntake - totalOutput,
        addVitalReading: (patientId: string, r: Omit<VitalReading, "id" | "admissionId">) =>
            addVitalReading(admissionId, patientId, r),
        addIOEntry: (patientId: string, e: Omit<IOEntry, "id" | "admissionId">) =>
            addIOEntry(admissionId, patientId, e),
    }
}
