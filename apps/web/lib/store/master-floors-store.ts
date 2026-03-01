// lib/store/master-floors-store.ts
// In-memory CRUD store for Master Floor entities.
// Uses useSyncExternalStore for consistent React integration.
// Swap the data source here when real APIs become available.

import { useSyncExternalStore } from "react"
import { MasterFloor, MasterFloorStatus, masterFloorsData } from "../data/master-floors"

export type { MasterFloor, MasterFloorStatus }

// ─── State ────────────────────────────────────────────────────────────────────
let _floors: MasterFloor[] = [...masterFloorsData]
const _listeners = new Set<() => void>()

function emit() {
    _listeners.forEach((fn) => fn())
}

function getSnapshot(): MasterFloor[] {
    return _floors
}

function subscribe(fn: () => void): () => void {
    _listeners.add(fn)
    return () => _listeners.delete(fn)
}

// ─── Actions ──────────────────────────────────────────────────────────────────
export function getMasterFloors(): MasterFloor[] {
    return _floors
}

export function createMasterFloor(data: Omit<MasterFloor, "id" | "created_at">): void {
    const newFloor: MasterFloor = {
        id: `mf-${Date.now()}`,
        created_at: new Date().toISOString().split("T")[0],
        ...data,
    }
    _floors = [newFloor, ..._floors]
    emit()
}

export function updateMasterFloor(id: string, data: Partial<Omit<MasterFloor, "id" | "created_at">>): void {
    _floors = _floors.map((f) => (f.id === id ? { ...f, ...data } : f))
    emit()
}

export function toggleMasterFloorStatus(id: string): void {
    _floors = _floors.map((f) =>
        f.id === id ? { ...f, status: f.status === "Active" ? "Inactive" : "Active" } : f
    )
    emit()
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useMasterFloorsStore() {
    const floors = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
    return {
        floors,
        createMasterFloor,
        updateMasterFloor,
        toggleMasterFloorStatus,
    }
}
