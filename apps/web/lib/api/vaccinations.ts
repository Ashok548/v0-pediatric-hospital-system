import useSWR from "swr";
import { apiClient } from "@/lib/api-client";

const fetcher = (url: string) => apiClient(url) as Promise<any>;

export function useVaccinationDashboard() {
    const { data, error, isLoading, mutate } = useSWR("/vaccinations/dashboard", fetcher);
    return { patients: data ?? [], isLoading, error, mutate };
}

export function usePatientVaccinations(patientId: string | null) {
    const { data, error, isLoading, mutate } = useSWR(
        patientId ? `/vaccinations/patient/${patientId}` : null,
        fetcher
    );
    return { schedule: data ?? [], isLoading, error, mutate };
}

export async function generateVaccinationSchedule(patientId: string) {
    return apiClient(`/vaccinations/generate-schedule/${patientId}`, {
        method: "POST"
    });
}

export async function administerVaccine(vaccineId: string, payload: any) {
    return apiClient(`/vaccinations/${vaccineId}/administer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
}
