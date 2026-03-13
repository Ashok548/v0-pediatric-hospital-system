import useSWR from "swr";
import { apiClient } from "@/lib/api-client";

const fetcher = (url: string) => apiClient(url) as Promise<any>;

export function useAdmissionServiceOrders(admissionId: string | null) {
    const { data, error, isLoading, mutate } = useSWR(
        admissionId ? `/service-orders/admission/${admissionId}` : null,
        fetcher
    );
    return { orders: data ?? [], isLoading, error, mutate };
}

export async function createServiceOrder(payload: any) {
    return apiClient("/service-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
}
