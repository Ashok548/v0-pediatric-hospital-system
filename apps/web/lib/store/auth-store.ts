// ─────────────────────────────────────────────────────────────────────────────
// lib/store/auth-store.ts
// Mock Role-Based Access Control simulator.
// No real auth — allows toggling between hospital roles to demonstrate
// conditional UI behavior in the app shell.
// ─────────────────────────────────────────────────────────────────────────────

import { useSyncExternalStore } from "react"

export type HospitalRole =
    | "admin"
    | "doctor"
    | "nurse"
    | "billing_clerk"
    | "pharmacist"

export interface MockUser {
    id: string
    name: string
    role: HospitalRole
    department: string
    avatar: string // initials
}

export const MOCK_USERS: MockUser[] = [
    { id: "USR-001", name: "Dr. Priya Reddy", role: "doctor", department: "Pediatric ICU", avatar: "PR" },
    { id: "USR-002", name: "Nurse Rekha", role: "nurse", department: "PICU Ward", avatar: "NR" },
    { id: "USR-003", name: "Ravi Shankar", role: "billing_clerk", department: "Billing", avatar: "RS" },
    { id: "USR-004", name: "Pharmacist Suresh", role: "pharmacist", department: "Pharmacy", avatar: "PS" },
    { id: "USR-005", name: "Admin Deepa", role: "admin", department: "Administration", avatar: "AD" },
]

// ─── Role Permissions ─────────────────────────────────────────────────────────
// Which roles can see / perform each feature area
export const ROLE_PERMISSIONS: Record<HospitalRole, string[]> = {
    admin: ["dashboard", "patients", "nicu", "appointments", "admissions", "beds", "lab", "billing", "vaccination", "reports", "settings", "nursing", "pharmacy", "master"],
    doctor: ["dashboard", "patients", "nicu", "appointments", "admissions", "beds", "lab", "vaccination", "nursing"],
    nurse: ["dashboard", "patients", "nicu", "admissions", "beds", "nursing", "lab"],
    billing_clerk: ["dashboard", "billing", "patients", "reports"],
    pharmacist: ["dashboard", "pharmacy", "patients"],
}

export function canAccess(role: HospitalRole, feature: string): boolean {
    return ROLE_PERMISSIONS[role]?.includes(feature) ?? false
}

// ─── State ────────────────────────────────────────────────────────────────────
let _currentUser: MockUser = MOCK_USERS[4] // Default: Admin (shows all nav items including Master Data)

const _listeners = new Set<() => void>()
function emit() { _listeners.forEach(fn => fn()) }

// ─── Actions ──────────────────────────────────────────────────────────────────
export function setMockRole(userId: string): void {
    const user = MOCK_USERS.find(u => u.id === userId)
    if (user) {
        _currentUser = user
        emit()
    }
}

function getSnapshot() { return _currentUser }
function subscribe(fn: () => void) {
    _listeners.add(fn)
    return () => _listeners.delete(fn)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuthStore() {
    const currentUser = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
    return {
        currentUser,
        currentRole: currentUser.role,
        setMockRole,
        canAccess: (feature: string) => canAccess(currentUser.role, feature),
    }
}
