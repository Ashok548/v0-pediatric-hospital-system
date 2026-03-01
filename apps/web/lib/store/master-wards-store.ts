// lib/store/master-wards-store.ts

import { useSyncExternalStore } from "react"
import { MasterWard, WardType, WardStatus, masterWardsData } from "../data/master-wards"
import { getMasterFloors } from "./master-floors-store"

export type { MasterWard, WardType, WardStatus }

// ─── State ────────────────────────────────────────────────────────────────────
let _wards: MasterWard[] = [...masterWardsData]
const _listeners = new Set<() => void>()

function emit() {
    _listeners.forEach((fn) => fn())
}

function getSnapshot(): MasterWard[] {
    return _wards
}

function subscribe(fn: () => void): () => void {
    _listeners.add(fn)
    return () => _listeners.delete(fn)
}

// ─── Actions ──────────────────────────────────────────────────────────────────
export function getMasterWards(): MasterWard[] {
    return _wards
}

export function createMasterWard(data: Omit<MasterWard, "id" | "created_at">): void {
    const newWard: MasterWard = {
        id: `mw-${Date.now()}`,
        created_at: new Date().toISOString().split("T")[0],
        ...data,
    }
    _wards = [newWard, ..._wards]
    emit()
}

export function updateMasterWard(id: string, data: Partial<Omit<MasterWard, "id" | "created_at">>): void {
    _wards = _wards.map((w) => (w.id === id ? { ...w, ...data } : w))
    emit()
}

export function toggleMasterWardStatus(id: string): void {
    _wards = _wards.map((w) =>
        w.id === id ? { ...w, status: w.status === "Active" ? "Inactive" : "Active" } : w
    )
    emit()
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useMasterWardsStore() {
    const wards = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
    const floors = getMasterFloors()
    return {
        wards,
        floors,
        createMasterWard,
        updateMasterWard,
        toggleMasterWardStatus,
    }
}
