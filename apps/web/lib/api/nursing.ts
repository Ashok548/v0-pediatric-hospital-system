// ─────────────────────────────────────────────────────────────────────────────
// lib/api/nursing.ts
// SWR hooks for Nursing Workflows (Notes and IO Records)
// ─────────────────────────────────────────────────────────────────────────────
import useSWR, { useSWRConfig } from "swr";
import { apiClient } from "@/lib/api-client";
import type { ApiNicuAdmission } from "@/lib/types/nicu"; // Has vitalsRecords

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ApiNursingNote {
    id: string;
    admissionId: string;
    noteType: string;
    content: string;
    priority: "NORMAL" | "URGENT" | "CRITICAL";
    shiftPeriod: "MORNING" | "AFTERNOON" | "NIGHT" | null;
    recordedAt: string;
    recordedBy: string | null;
}

export interface CreateNursingNotePayload {
    noteType: string;
    content: string;
    priority?: "NORMAL" | "URGENT" | "CRITICAL";
    shiftPeriod?: "MORNING" | "AFTERNOON" | "NIGHT";
}

export interface ApiIoRecord {
    id: string;
    admissionId: string;
    ioType: "INTAKE" | "OUTPUT";
    route: string;
    volumeMl: number;
    notes?: string;
    recordedAt: string;
    recordedBy: string | null;
}

export interface CreateIoRecordPayload {
    ioType: "INTAKE" | "OUTPUT";
    route: string;
    volumeMl: number;
    notes?: string;
}

export interface HandoverAdmission extends ApiNicuAdmission {
    nursingNotes: ApiNursingNote[];
}

const fetcher = (url: string) => apiClient(url) as Promise<any>;

// ─── Handover Hooks ─────────────────────────────────────────────────────────

export function useHandoverSummary(department: string, shift: string) {
    const qs = new URLSearchParams({ department, shift }).toString();
    const { data, error, isLoading, mutate } = useSWR<HandoverAdmission[]>(
        `/nursing/handover?${qs}`,
        fetcher
    );
    return {
        admissions: data ?? [],
        isLoading,
        error,
        mutate,
    };
}

// ─── Nursing Notes Hooks ────────────────────────────────────────────────────

export function useNursingNotes(admissionId: string | null) {
    const { data, error, isLoading, mutate } = useSWR<ApiNursingNote[]>(
        admissionId ? `/nursing/notes/${admissionId}` : null,
        fetcher
    );
    return {
        notes: data ?? [],
        isLoading,
        error,
        mutate,
    };
}

export function useCreateNursingNote() {
    const { mutate } = useSWRConfig();
    return async (admissionId: string, payload: CreateNursingNotePayload): Promise<ApiNursingNote> => {
        const result = await apiClient<ApiNursingNote>(`/nursing/notes/${admissionId}`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
        await Promise.all([
            mutate(`/nursing/notes/${admissionId}`),
            mutate((key: string) => typeof key === "string" && key.startsWith("/nursing/handover")),
        ]);
        return result;
    };
}

export function useUpdateNursingNote() {
    const { mutate } = useSWRConfig();
    return async (noteId: string, payload: Partial<CreateNursingNotePayload>): Promise<ApiNursingNote> => {
        const result = await apiClient<ApiNursingNote>(`/nursing/notes/${noteId}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });
        // We mutate the specific admission's notes + handover list
        await Promise.all([
            mutate(`/nursing/notes/${result.admissionId}`),
            mutate((key: string) => typeof key === "string" && key.startsWith("/nursing/handover")),
        ]);
        return result;
    };
}

export function useDeleteNursingNote() {
    const { mutate } = useSWRConfig();
    return async (noteId: string, admissionId: string): Promise<void> => {
        await apiClient(`/nursing/notes/${noteId}`, { method: "DELETE" });
        await Promise.all([
            mutate(`/nursing/notes/${admissionId}`),
            mutate((key: string) => typeof key === "string" && key.startsWith("/nursing/handover")),
        ]);
    };
}

// ─── IO Records Hooks ───────────────────────────────────────────────────────

export function useIoRecords(admissionId: string | null) {
    const { data, error, isLoading, mutate } = useSWR<ApiIoRecord[]>(
        admissionId ? `/nursing/io/${admissionId}` : null,
        fetcher
    );
    return {
        records: data ?? [],
        isLoading,
        error,
        mutate,
    };
}

export function useCreateIoRecord() {
    const { mutate } = useSWRConfig();
    return async (admissionId: string, payload: CreateIoRecordPayload): Promise<ApiIoRecord> => {
        const result = await apiClient<ApiIoRecord>(`/nursing/io/${admissionId}`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
        await mutate(`/nursing/io/${admissionId}`);
        return result;
    };
}

export function useDeleteIoRecord() {
    const { mutate } = useSWRConfig();
    return async (recordId: string, admissionId: string): Promise<void> => {
        await apiClient(`/nursing/io/${recordId}`, { method: "DELETE" });
        await mutate(`/nursing/io/${admissionId}`);
    };
}

export function useUpdateIoRecord() {
    const { mutate } = useSWRConfig();
    return async (recordId: string, admissionId: string, payload: Partial<CreateIoRecordPayload>): Promise<ApiIoRecord> => {
        const result = await apiClient<ApiIoRecord>(`/nursing/io/${recordId}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });
        await mutate(`/nursing/io/${admissionId}`);
        return result;
    };
}

export function useDeleteVitalRecord() {
    const { mutate } = useSWRConfig();
    return async (vitalId: string, admissionId: string): Promise<void> => {
        await apiClient(`/nursing/vitals/${vitalId}`, { method: "DELETE" });
        await mutate(`/nicu/vitals/${admissionId}`);
    };
}
