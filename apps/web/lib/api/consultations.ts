import useSWR from "swr";
import { apiClient } from "@/lib/api-client";

const fetcher = (url: string) => apiClient(url) as Promise<any>;

export function usePatientConsultations(patientId: string | null) {
    const { data, error, isLoading, mutate } = useSWR(
        patientId ? `/consultations/patient/${patientId}` : null,
        fetcher
    );
    return { consultations: data ?? [], isLoading, error, mutate };
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
