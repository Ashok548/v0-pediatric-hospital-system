import useSWR from "swr";
import { apiClient } from "@/lib/api-client";

const fetcher = (url: string) => apiClient(url) as Promise<any>;

export interface OPVisit {
    id: string;
    opNumber: string;
    patientId: string;
    appointmentId?: string;
    doctorId?: string;
    department: string;
    visitDate: string;
    status: "REGISTERED" | "TRIAGED" | "PRE_CONSULT" | "CONSULTING" | "ORDERS_PLACED" | "IN_PROGRESS" | "COMPLETED" | "BILLED" | "CANCELLED" | "CONVERTED_TO_ER";
    notes?: string;
    patient: {
        id: string;
        uhid: string;
        firstName: string;
        lastName: string;
        phone: string;
        gender: string;
        dateOfBirth: string;
    };
    appointment?: {
        id: string;
        token: number;
        timeSlot: string;
        type: string;
        status: string;
        department: string;
    };
    bill?: {
        id: string;
        billNumber: string;
        status: string;
        netAmount: string;
    };
}

interface OPVisitsQuery {
    date?: string;
    patientId?: string;
    status?: string;
}

export function useOPVisits(query: OPVisitsQuery = {}) {
    const params = new URLSearchParams();
    if (query.date) params.set("date", query.date);
    if (query.patientId) params.set("patientId", query.patientId);
    if (query.status) params.set("status", query.status);

    const qs = params.toString() ? `?${params}` : "";

    const { data, error, isLoading, mutate } = useSWR<OPVisit[]>(
        `/op-visits${qs}`,
        fetcher,
        { keepPreviousData: true }
    );

    return { opVisits: data || [], isLoading, error, mutate };
}

export async function createOPVisit(data: {
    patientId: string;
    appointmentId?: string;
    doctorId?: string;
    department: string;
    notes?: string;
}): Promise<OPVisit> {
    return apiClient<OPVisit>("/op-visits", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateOPVisitStatus(
    id: string,
    status: string
): Promise<OPVisit> {
    return apiClient<OPVisit>(`/op-visits/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
}
