// lib/store/master-beds-store.ts

import { useSyncExternalStore } from "react"
import { MasterBed, MasterBedStatus, masterBedsData } from "../data/master-beds"
import { getMasterFloors } from "./master-floors-store"
import { getMasterWards } from "./master-wards-store"

export type { MasterBed, MasterBedStatus }

// ─── State ────────────────────────────────────────────────────────────────────
let _beds: MasterBed[] = [...masterBedsData]
const _listeners = new Set<() => void>()

function emit() {
    _listeners.forEach((fn) => fn())
}

function getSnapshot(): MasterBed[] {
    return _beds
}

function subscribe(fn: () => void): () => void {
    _listeners.add(fn)
    return () => _listeners.delete(fn)
}

// ─── Actions ──────────────────────────────────────────────────────────────────
export function getMasterBeds(): MasterBed[] {
    return _beds
}

export function createMasterBed(data: Omit<MasterBed, "id" | "created_at">): void {
    const newBed: MasterBed = {
        id: `mb-${Date.now()}`,
        created_at: new Date().toISOString().split("T")[0],
        ...data,
    }
    _beds = [newBed, ..._beds]
    emit()
}

export function updateMasterBed(id: string, data: Partial<Omit<MasterBed, "id" | "created_at">>): void {
    _beds = _beds.map((b) => (b.id === id ? { ...b, ...data } : b))
    emit()
}

export function toggleMasterBedStatus(id: string): void {
    const bed = _beds.find((b) => b.id === id)
    if (!bed) return
    const next: MasterBedStatus = bed.status === "Available" ? "Maintenance" : "Available"
    _beds = _beds.map((b) => (b.id === id ? { ...b, status: next } : b))
    emit()
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useMasterBedsStore() {
    const beds = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
    const floors = getMasterFloors()
    const wards = getMasterWards()
    return {
        beds,
        floors,
        wards,
        createMasterBed,
        updateMasterBed,
        toggleMasterBedStatus,
    }
}
