import useSWR from 'swr';
import { apiClient } from "@/lib/api-client";

const fetcher = (url: string) => apiClient(url) as Promise<any>;

export interface ApiMedication {
    id: string;
    drugName: string;
    genericName: string;
    form: string;
    strength: string;
    unit: string;
    unitPrice: number;
    stockAvailable: number;
    reorderLevel: number;
    severity?: 'CRITICAL' | 'WARNING' | 'LOW';
    deficit?: number;
    suggestedOrderQty?: number;
    earliestExpiry?: string;
    expiringSoon?: boolean;
    status?: 'ACTIVE' | 'INACTIVE';
}

export interface ApiPrescriptionItem {
    id: string;
    prescriptionId: string;
    medication: ApiMedication;
    prescribedQty: number;
    dispensedQty: number;
    dose?: string;
    frequency?: string;
    duration?: number;
    instructions?: string;
}

export interface ApiPrescription {
    id: string;
    prescriptionNumber: string;
    patient: {
        id: string;
        firstName: string;
        lastName: string;
        uhid: string;
    };
    admission?: {
        id: string;
        currentBed?: {
            id: string;
            ward: {
                id: string;
                type: string;
                name: string;
            };
            bedNumber: string;
        };
    };
    doctor: {
        id: string;
        name: string;
    };
    status: 'PENDING' | 'PARTIAL' | 'DISPENSED' | 'RETURNED' | 'CANCELLED';
    notes?: string;
    orderedAt: string;
    dispensedAt?: string;
    dispensedBy?: string;
    items: ApiPrescriptionItem[];
}

export interface PharmacyStats {
    totalActive: number;
    pending: number;
    partial: number;
    dispensedToday: number;
    lowStockCount: number;
    urgentCount: number;
}

export function usePharmacyInventory() {
    const { data, error, mutate, isLoading } = useSWR<{ data: ApiMedication[] }>(
        '/pharmacy/inventory',
        fetcher
    );
    return {
        inventory: data?.data ?? [],
        isLoading,
        error,
        mutate,
    };
}

export function useLowStockInventory() {
    const { data, error, mutate, isLoading } = useSWR<{ data: ApiMedication[] }>(
        '/pharmacy/inventory/low-stock',
        fetcher,
        { refreshInterval: 60000 }
    );
    return {
        lowStock: data?.data ?? [],
        isLoading,
        error,
        mutate,
    };
}

export function usePrescriptions(params?: { status?: string; search?: string; admissionId?: string; patientId?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.admissionId) searchParams.set('admissionId', params.admissionId);
    if (params?.patientId) searchParams.set('patientId', params.patientId);

    const qs = searchParams.toString();
    const url = qs ? `/pharmacy/prescriptions?${qs}` : '/pharmacy/prescriptions';

    const { data, error, mutate, isLoading } = useSWR<{ data: ApiPrescription[] }>(
        url,
        fetcher,
        { refreshInterval: 15000 } // Auto-refresh every 15s to get new prescriptions
    );

    return {
        prescriptions: data?.data ?? [],
        isLoading,
        error,
        mutate,
    };
}

export function usePharmacyStats() {
    const { data, error, mutate, isLoading } = useSWR<{ data: PharmacyStats }>(
        '/pharmacy/stats',
        fetcher,
        { refreshInterval: 30000 }
    );
    return {
        stats: data?.data ?? { totalActive: 0, pending: 0, partial: 0, dispensedToday: 0, lowStockCount: 0, urgentCount: 0 },
        isLoading,
        error,
        mutate,
    };
}

export async function dispensePrescription(id: string, items: { prescriptionItemId: string, dispensedQty: number }[]) {
    return apiClient<{ success: boolean; newStatus: string }>(`/pharmacy/prescriptions/${id}/dispense`, { method: "POST", body: JSON.stringify({ items }) });
}

export async function returnPrescription(id: string, reason: string) {
    return apiClient<{ success: boolean }>(`/pharmacy/prescriptions/${id}/return`, { method: "POST", body: JSON.stringify({ reason }) });
}

export async function createPrescription(payload: any) {
    return apiClient(`/pharmacy/prescriptions`, { method: "POST", body: JSON.stringify(payload) });
}

export async function adjustStock(medicationId: string, payload: { quantity: number; batchNumber?: string; reason?: string }) {
    return apiClient<{ success: boolean; data: any }>(`/pharmacy/inventory/${medicationId}/adjust`, { method: "POST", body: JSON.stringify(payload) });
}

export function usePharmacyClearance(admissionId: string) {
    const { data, error, isLoading } = useSWR<{ data: { cleared: boolean; pendingPrescriptions: any[] } }>(
        admissionId ? `/pharmacy/admission/${admissionId}/clearance` : null,
        fetcher
    );
    return {
        clearance: data?.data,
        isLoading,
        error
    };
}

export async function createMedication(data: Partial<ApiMedication>) {
    const res = await apiClient('/pharmacy/inventory', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return res as unknown as { success: true; data: ApiMedication };
}

export async function bulkCreateMedications(medications: Partial<ApiMedication>[]) {
    const res = await apiClient('/pharmacy/inventory/bulk', {
        method: 'POST',
        body: JSON.stringify({ medications }),
    });
    return res as unknown as { success: true; data: { count: number } };
}
export async function updateMedication(id: string, data: Partial<ApiMedication>) {
    const res = await apiClient(`/pharmacy/inventory/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return res as unknown as { success: true; data: ApiMedication };
}

export async function deactivateMedication(id: string) {
    const res = await apiClient(`/pharmacy/inventory/${id}`, {
        method: 'DELETE',
    });
    return res as unknown as { success: true };
}
