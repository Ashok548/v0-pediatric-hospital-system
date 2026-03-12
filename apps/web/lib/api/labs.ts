import useSWR from "swr";
import { apiClient } from "@/lib/api-client";

const fetcher = (url: string) => apiClient(url) as Promise<any>;

export function usePatientLabOrders(patientId: string | null) {
    const { data, error, isLoading, mutate } = useSWR(
        patientId ? `/labs/orders/patient/${patientId}` : null,
        fetcher
    );
    return { orders: data ?? [], isLoading, error, mutate };
}

export function useAdmissionLabOrders(admissionId: string | null) {
    const { data, error, isLoading, mutate } = useSWR(
        admissionId ? `/labs/orders/admission/${admissionId}` : null,
        fetcher
    );
    return { orders: data ?? [], isLoading, error, mutate };
}

export function useLabOrders() {
    const { data, error, isLoading, mutate } = useSWR(
        '/labs/orders',
        fetcher
    );
    return { orders: data ?? [], isLoading, error, mutate };
}

export function useLabOrder(orderId: string | null) {
    const { data, error, isLoading, mutate } = useSWR(
        orderId ? `/labs/orders/${orderId}` : null,
        fetcher
    );
    return { order: data ?? null, isLoading, error, mutate };
}

export async function createLabOrder(payload: any) {
    return apiClient("/labs/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
}

export async function updateLabPanelResults(panelId: string, payload: any) {
    return apiClient(`/labs/panels/${panelId}/results`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
}

export async function finalizeLabOrder(orderId: string) {
    return apiClient(`/labs/orders/${orderId}/finalize`, {
        method: "POST"
    });
}

export async function collectSample(panelId: string) {
    return apiClient(`/labs/panels/${panelId}/collect`, {
        method: "PUT"
    });
}

export async function receiveSample(panelId: string) {
    return apiClient(`/labs/panels/${panelId}/receive`, {
        method: "PUT"
    });
}
