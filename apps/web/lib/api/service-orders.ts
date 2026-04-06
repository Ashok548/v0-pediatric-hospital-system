import useSWR from "swr";
import { apiClient } from "@/lib/api-client";

const fetcher = (url: string) => apiClient(url) as Promise<any>;
const SERVICE_ORDER_REFRESH_INTERVAL = 15000;

export interface ApiServiceOrder {
    id: string;
    orderNumber: string;
    patientId: string;
    admissionId?: string | null;
    appointmentId?: string | null;
    opVisitId?: string | null;
    quantity: number;
    status: string;
    priority: string;
    notes?: string | null;
    orderDate: string;
    completedAt?: string | null;
    service: {
        id: string;
        name: string;
        code: string;
        category: string;
    };
    doctor?: {
        id: string;
        name: string;
    };
    admission?: {
        id: string;
        admissionNumber?: string;
        department?: string;
    } | null;
    appointment?: {
        id: string;
        appointmentDate?: string;
        doctor?: {
            id: string;
            name: string;
        };
    } | null;
    opVisit?: {
        id: string;
        opNumber?: string;
        department?: string;
    } | null;
}

export interface CreateServiceOrderPayload {
    patientId: string;
    admissionId?: string;
    appointmentId?: string;
    opVisitId?: string;
    serviceId: string;
    quantity?: number;
    priority?: string;
    notes?: string;
}

export function useAdmissionServiceOrders(admissionId: string | null) {
    const { data, error, isLoading, mutate } = useSWR<ApiServiceOrder[]>(
        admissionId ? `/service-orders/admission/${admissionId}` : null,
        fetcher,
        { refreshInterval: SERVICE_ORDER_REFRESH_INTERVAL }
    );
    return { orders: data ?? [], isLoading, error, mutate };
}

export function usePatientServiceOrders(patientId: string | null) {
    const { data, error, isLoading, mutate } = useSWR<ApiServiceOrder[]>(
        patientId ? `/service-orders/patient/${patientId}` : null,
        fetcher,
        { refreshInterval: SERVICE_ORDER_REFRESH_INTERVAL }
    );
    return { orders: data ?? [], isLoading, error, mutate };
}

export async function createServiceOrder(payload: CreateServiceOrderPayload) {
    return apiClient("/service-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
}
