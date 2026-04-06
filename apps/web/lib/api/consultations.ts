import useSWR from "swr";
import { apiClient } from "@/lib/api-client";

const fetcher = (url: string) => apiClient(url) as Promise<any>;

export interface ApiConsultation {
    id: string;
    patientId: string;
    doctorId: string;
    appointmentId?: string | null;
    admissionId?: string | null;
    opVisitId?: string | null;
    status: "DRAFT" | "SIGNED" | "AMENDED";
    signedAt?: string | null;
    chiefComplaint?: string | null;
    historyOfIllness?: string | null;
    examinationNotes?: string | null;
    diagnosis?: string | null;
    plan?: string | null;
    createdAt: string;
    updatedAt: string;
    doctor?: {
        id: string;
        name: string;
    };
}

export interface PaginatedConsultations {
    data: ApiConsultation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export function usePatientConsultations(patientId: string | null) {
    const { data, error, isLoading, mutate } = useSWR<PaginatedConsultations>(
        patientId ? `/consultations/patient/${patientId}` : null,
        fetcher
    );
    return { consultations: data?.data ?? [], isLoading, error, mutate };
}

export async function createConsultation(payload: any) {
    return apiClient("/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
}

export async function updateConsultation(id: string, payload: any) {
    return apiClient(`/consultations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
}
