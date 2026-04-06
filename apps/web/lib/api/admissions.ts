// ─────────────────────────────────────────────────────────────────────────────
// lib/api/admissions.ts
// SWR hooks and mutation functions for the NestJS Admissions API.
// ─────────────────────────────────────────────────────────────────────────────
import useSWR, { useSWRConfig } from "swr"
import { apiClient } from "@/lib/api-client"
import type {
    ApiAdmission,
    ApiFloorWithWards,
    ApiBed,
    PaginatedAdmissions,
    CreateAdmissionPayload,
    BedTransferPayload,
    DischargeClearancePayload,
    FinalizeDischargePayload,
    AdmissionsQuery,
} from "@/lib/types/admission"

// ─── SWR Fetcher ─────────────────────────────────────────────────────────────
const fetcher = (url: string) => apiClient(url) as Promise<any>

// ─── Query String Builder ─────────────────────────────────────────────────────
function buildQuery(params: Record<string, any>): string {
    const qs = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "" && v !== "all")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&")
    return qs ? `?${qs}` : ""
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** GET /admissions — paginated list with optional filters */
export function useAdmissions(query: AdmissionsQuery = {}) {
    const qs = buildQuery(query as Record<string, any>)
    const { data, error, isLoading, mutate } = useSWR<PaginatedAdmissions>(
        `/admissions${qs}`,
        fetcher,
        { keepPreviousData: true }
    )
    return {
        admissions: data?.data ?? [],
        pagination: data ? { total: data.total, page: data.page, limit: data.limit, totalPages: data.totalPages } : null,
        isLoading,
        error,
        mutate,
    }
}

/** GET /admissions/:id — full admission detail */
export function useAdmission(id: string | null | undefined) {
    const { data, error, isLoading, mutate } = useSWR<ApiAdmission>(
        id ? `/admissions/${id}` : null,
        fetcher
    )
    return { admission: data ?? null, isLoading, error, mutate }
}

/** GET /patients/:id/admissions — admission history for a patient */
export function usePatientAdmissions(patientId: string | null | undefined) {
    const { data, error, isLoading, mutate } = useSWR<ApiAdmission[]>(
        patientId ? `/patients/${patientId}/admissions` : null,
        fetcher
    )
    return { admissions: data ?? [], isLoading, error, mutate }
}

/**
 * GET /master/floors (with wards + beds nested via multiple calls).
 * Returns flat floors, but each ward includes its beds via /master/wards + /master/beds.
 * We use a single endpoint that the backend master module already supports.
 * Actual hierarchy is built on the frontend by chaining the 3 existing flat endpoints.
 */
export function useBedHierarchy() {
    const { data, error, isLoading, mutate } = useSWR<ApiFloorWithWards[]>(
        "/beds/hierarchy",
        fetcher,
        { revalidateOnFocus: false }
    )
    return { floors: data ?? [], isLoading, error, mutate }
}

/** GET /master/beds?wardId=... — available beds for a ward (used in wizard) */
export function useAvailableBeds(wardId: string | null | undefined) {
    const qs = wardId ? `?wardId=${wardId}&status=AVAILABLE` : null
    const { data, error, isLoading } = useSWR<{ data: ApiBed[] }>(
        qs ? `/master/beds${qs}` : null,
        fetcher
    )
    return { beds: data?.data ?? [], isLoading, error }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** POST /admissions — create new admission */
export async function createAdmission(payload: CreateAdmissionPayload): Promise<ApiAdmission> {
    return apiClient<ApiAdmission>("/admissions", {
        method: "POST",
        body: JSON.stringify(payload),
    })
}

/** POST /admissions/:id/transfer — move to a new bed */
export async function transferBed(id: string, payload: BedTransferPayload): Promise<ApiAdmission> {
    return apiClient<ApiAdmission>(`/admissions/${id}/transfer`, {
        method: "POST",
        body: JSON.stringify(payload),
    })
}

/** PATCH /admissions/:id/discharge/clearance — single-step clearance update */
export async function updateDischargeClearance(
    id: string,
    payload: DischargeClearancePayload
): Promise<ApiAdmission> {
    return apiClient<ApiAdmission>(`/admissions/${id}/discharge/clearance`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    })
}

/** POST /admissions/:id/discharge/finalize — all clearances done, discharge patient */
export async function finalizeDischarge(
    id: string,
    payload: FinalizeDischargePayload
): Promise<ApiAdmission> {
    return apiClient<ApiAdmission>(`/admissions/${id}/discharge/finalize`, {
        method: "POST",
        body: JSON.stringify(payload),
    })
}

/** POST /admissions/:id/discharge/generate-summary — AI-generated summary draft */
export async function generateDischargeSummary(id: string, dischargeType?: string): Promise<{ summary: string }> {
    return apiClient<{ summary: string }>(`/admissions/${id}/discharge/generate-summary`, {
        method: "POST",
        body: JSON.stringify({ dischargeType }),
    })
}

/** DELETE /admissions/:id — cancel admission */
export async function cancelAdmission(id: string): Promise<ApiAdmission> {
    return apiClient<ApiAdmission>(`/admissions/${id}`, { method: "DELETE" })
}

/** PATCH /master/beds/:id/status — update a bed status (marking Available, etc.) */
export async function updateBedStatus(id: string, status: string, notes?: string): Promise<ApiBed> {
    return apiClient<ApiBed>(`/master/beds/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, notes }),
    })
}

/**
 * Hook version of updateBedStatus.
 * Wraps the mutation with:
 *   - Sonner toast for success/error feedback
 *   - SWR global mutate to refresh /beds/hierarchy after a status change
 */
export function useUpdateBedStatus() {
    const { mutate } = useSWRConfig()

    return async (id: string, status: string, notes?: string) => {
        const { toast } = await import("sonner")
        try {
            await updateBedStatus(id, status, notes)
            toast.success(`Bed status updated to ${status.toLowerCase()}`)
            // Invalidate the hierarchy cache so grids re-render with new status
            await mutate("/beds/hierarchy")
        } catch {
            toast.error("Failed to update bed status. Please try again.")
        }
    }
}
