// ─────────────────────────────────────────────────────────────────────────────
// lib/api/nicu.ts
// SWR hooks and mutation functions for the NICU and Growth APIs.
// ─────────────────────────────────────────────────────────────────────────────
import useSWR, { useSWRConfig } from "swr"
import { apiClient } from "@/lib/api-client"
import type {
    PaginatedNicuAdmissions,
    ApiNicuVitals,
    ApiGrowthRecord,
    CreateVitalsPayload,
    CreateGrowthRecordPayload,
} from "@/lib/types/nicu"

const fetcher = (url: string) => apiClient(url)

// ─── NICU Admissions ──────────────────────────────────────────────────────────

/** Fetch all ADMITTED NICU admissions (with latest vitals snapshot) */
export function useNicuAdmissions(search?: string) {
    const qs = search ? `?search=${encodeURIComponent(search)}&limit=100` : "?limit=100"
    const { data, error, isLoading, mutate } = useSWR<PaginatedNicuAdmissions>(
        `/nicu/admissions${qs}`,
        fetcher,
        { refreshInterval: 30_000 }  // Auto-refresh every 30s for live status
    )
    return {
        admissions: data?.data ?? [],
        total: data?.total ?? 0,
        isLoading,
        error,
        mutate,
    }
}

// ─── NICU Vitals ─────────────────────────────────────────────────────────────

/** Fetch full vitals history for one NICU admission */
export function useAdmissionVitals(admissionId: string | null) {
    const { data, error, isLoading, mutate } = useSWR<ApiNicuVitals[]>(
        admissionId ? `/nicu/admissions/${admissionId}/vitals` : null,
        fetcher
    )
    return {
        vitals: data ?? [],
        isLoading,
        error,
        mutate,
    }
}

/** Record new vitals for a NICU patient and refresh both caches */
export function useRecordVitals() {
    const { mutate } = useSWRConfig()
    return async (admissionId: string, payload: CreateVitalsPayload): Promise<ApiNicuVitals> => {
        const result = await apiClient<ApiNicuVitals>(`/nicu/admissions/${admissionId}/vitals`, {
            method: "POST",
            body: JSON.stringify(payload),
        })
        // Refresh both the admission list (updated latest vitals) and the vitals history
        await Promise.all([
            mutate((key: string) => typeof key === "string" && key.startsWith("/nicu/admissions")),
        ])
        return result
    }
}

/** Delete a vitals entry */
export async function deleteVitals(vitalsId: string): Promise<void> {
    await apiClient(`/nicu/vitals/${vitalsId}`, { method: "DELETE" })
}

// ─── Growth Records ───────────────────────────────────────────────────────────

/** Fetch all growth records for a patient */
export function usePatientGrowth(patientId: string | null) {
    const { data, error, isLoading, mutate } = useSWR<ApiGrowthRecord[]>(
        patientId ? `/growth/${patientId}` : null,
        fetcher
    )
    return {
        records: data ?? [],
        isLoading,
        error,
        mutate,
    }
}

/** Add a new growth record and refresh the cache */
export function useAddGrowthRecord() {
    const { mutate } = useSWRConfig()
    return async (patientId: string, payload: CreateGrowthRecordPayload): Promise<ApiGrowthRecord> => {
        const result = await apiClient<ApiGrowthRecord>(`/growth/${patientId}`, {
            method: "POST",
            body: JSON.stringify(payload),
        })
        await mutate(`/growth/${patientId}`)
        return result
    }
}

/** Delete a growth record */
export async function deleteGrowthRecord(recordId: string): Promise<void> {
    await apiClient(`/growth/${recordId}`, { method: "DELETE" })
}
