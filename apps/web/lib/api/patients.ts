// ─────────────────────────────────────────────────────────────────────────────
// lib/api/patients.ts
// SWR hooks for the Patients API (search/list only — used by growth tracking etc.)
// ─────────────────────────────────────────────────────────────────────────────
import useSWR from "swr"
import { apiClient } from "@/lib/api-client"

export interface ApiPatient {
    id: string
    uhid: string
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: string
    bloodGroup?: string | null
    phone?: string | null
    guardianName?: string | null
    guardianPhone?: string | null
    guardianRelationship?: string | null
    birthWeight?: number | null
    allergies?: string[]
}

export interface ApiPatientDetail {
    id: string
    uhid: string
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: "MALE" | "FEMALE" | "OTHER"
    bloodGroup: string | null
    phone: string | null
    email: string | null
    guardianName: string | null
    guardianPhone: string | null
    guardianRelationship: string | null
    birthWeight: number | null
    allergies?: string[]
    address: string | null
    city: string | null
    state: string | null
    pincode: string | null
    abhaId: string | null
    status: "ACTIVE" | "INACTIVE"
    createdAt: string
    updatedAt: string
}

const fetcher = (url: string) => apiClient(url) as Promise<any>

interface PatientsQuery {
    search?: string
    limit?: number
    page?: number
}

/** GET /patients — paginated list with optional search */
export function usePatients(query: PatientsQuery = {}) {
    const params = new URLSearchParams()
    if (query.search) params.set("search", query.search)
    if (query.limit) params.set("limit", String(query.limit))
    if (query.page) params.set("page", String(query.page))
    const qs = params.toString() ? `?${params}` : ""

    const { data, error, isLoading } = useSWR<{ data: ApiPatient[]; total: number }>(
        `/patients${qs}`,
        fetcher,
        { keepPreviousData: true }
    )
    return {
        patients: data?.data ?? [],
        total: data?.total ?? 0,
        isLoading,
        error,
    }
}

/** GET /patients/:id — single patient */
export function usePatient(id: string | null) {
    const { data, error, isLoading, mutate } = useSWR<ApiPatientDetail>(
        id ? `/patients/${id}` : null,
        fetcher
    )
    return { patient: data ?? null, isLoading, error, mutate }
}
