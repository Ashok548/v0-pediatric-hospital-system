// lib/store/master-departments-store.ts

import { useSyncExternalStore } from "react"
import { Department, DepartmentStatus, masterDepartmentsData } from "../data/master-departments"

export type { Department, DepartmentStatus }

// ─── State ────────────────────────────────────────────────────────────────────
let _departments: Department[] = [...masterDepartmentsData]
const _listeners = new Set<() => void>()

function emit() {
    _listeners.forEach((fn) => fn())
}

function getSnapshot(): Department[] {
    return _departments
}

function subscribe(fn: () => void): () => void {
    _listeners.add(fn)
    return () => _listeners.delete(fn)
}

// ─── Actions ──────────────────────────────────────────────────────────────────
export function getMasterDepartments(): Department[] {
    return _departments
}

export function createDepartment(data: Omit<Department, "id" | "created_at">): void {
    const newDept: Department = {
        id: `dept-${Date.now()}`,
        created_at: new Date().toISOString().split("T")[0],
        ...data,
    }
    _departments = [newDept, ..._departments]
    emit()
}

export function updateDepartment(id: string, data: Partial<Omit<Department, "id" | "created_at">>): void {
    _departments = _departments.map((d) => (d.id === id ? { ...d, ...data } : d))
    emit()
}

export function toggleDepartmentStatus(id: string): void {
    _departments = _departments.map((d) =>
        d.id === id ? { ...d, status: d.status === "Active" ? "Inactive" : "Active" } : d
    )
    emit()
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useMasterDepartmentsStore() {
    const departments = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
    return {
        departments,
        createDepartment,
        updateDepartment,
        toggleDepartmentStatus,
    }
}
