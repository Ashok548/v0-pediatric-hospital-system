import { useEffect, useState } from "react"
import { useAuth, type AuthUser } from "@/hooks/use-auth"

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

const ROLE_MAP: Record<string, HospitalRole> = {
    ADMIN: "admin",
    DOCTOR: "doctor",
    NURSE: "nurse",
    BILLING: "billing_clerk",
    RECEPTIONIST: "billing_clerk",
    PHARMACIST: "pharmacist",
}

const DEFAULT_DEPARTMENTS: Record<HospitalRole, string> = {
    admin: "Administration",
    doctor: "Outpatient Department",
    nurse: "Nursing",
    billing_clerk: "Billing",
    pharmacist: "Pharmacy",
}

function mapAuthUser(user?: AuthUser): MockUser | null {
    if (!user) {
        return null
    }

    const mappedRole = ROLE_MAP[user.role?.name] ?? "admin"

    return {
        id: user.id,
        name: user.name,
        role: mappedRole,
        department: DEFAULT_DEPARTMENTS[mappedRole],
        avatar: user.name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? "")
            .join("") || "U",
    }
}

function isDevRoleSwitchingEnabled() {
    return process.env.NODE_ENV !== "production"
}

// ─── State ────────────────────────────────────────────────────────────────────
let _mockUserId: string | null = null

const _listeners = new Set<() => void>()
function emit() { _listeners.forEach(fn => fn()) }

// ─── Actions ──────────────────────────────────────────────────────────────────
export function setMockRole(userId: string): void {
    if (!isDevRoleSwitchingEnabled()) {
        return
    }

    const user = MOCK_USERS.find(u => u.id === userId)
    if (user) {
        _mockUserId = user.id
        emit()
    }
}

function subscribe(fn: () => void) {
    _listeners.add(fn)
    return () => { _listeners.delete(fn) }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuthStore() {
    const { user, isLoading } = useAuth()
    const [, setMockRevision] = useState(0)

    useEffect(() => subscribe(() => setMockRevision((revision) => revision + 1)), [])

    const sessionUser = mapAuthUser(user)
    const currentUser = isDevRoleSwitchingEnabled() && _mockUserId
        ? (MOCK_USERS.find((candidate) => candidate.id === _mockUserId) ?? sessionUser)
        : sessionUser

    return {
        currentUser,
        currentRole: currentUser?.role,
        setMockRole,
        isLoading,
        isUsingMockRole: Boolean(isDevRoleSwitchingEnabled() && _mockUserId),
        canAccess: (feature: string) => currentUser ? canAccess(currentUser.role, feature) : false,
    }
}
