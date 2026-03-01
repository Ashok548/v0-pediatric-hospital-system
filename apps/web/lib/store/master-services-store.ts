// lib/store/master-services-store.ts

import { useSyncExternalStore } from "react"
import { MasterService, ServiceCategory, ServiceStatus, masterServicesData } from "../data/master-services"

export type { MasterService, ServiceCategory, ServiceStatus }

// ─── State ────────────────────────────────────────────────────────────────────
let _services: MasterService[] = [...masterServicesData]
const _listeners = new Set<() => void>()

function emit() {
    _listeners.forEach((fn) => fn())
}

function getSnapshot(): MasterService[] {
    return _services
}

function subscribe(fn: () => void): () => void {
    _listeners.add(fn)
    return () => _listeners.delete(fn)
}

// ─── Actions ──────────────────────────────────────────────────────────────────
export function getMasterServices(): MasterService[] {
    return _services
}

export function createService(data: Omit<MasterService, "id" | "created_at">): void {
    const newService: MasterService = {
        id: `svc-${Date.now()}`,
        created_at: new Date().toISOString().split("T")[0],
        ...data,
    }
    _services = [newService, ..._services]
    emit()
}

export function updateService(id: string, data: Partial<Omit<MasterService, "id" | "created_at">>): void {
    _services = _services.map((s) => (s.id === id ? { ...s, ...data } : s))
    emit()
}

export function toggleServiceStatus(id: string): void {
    _services = _services.map((s) =>
        s.id === id ? { ...s, status: s.status === "Active" ? "Inactive" : "Active" } : s
    )
    emit()
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useMasterServicesStore() {
    const services = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
    return {
        services,
        createService,
        updateService,
        toggleServiceStatus,
    }
}
