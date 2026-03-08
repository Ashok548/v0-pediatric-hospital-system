import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import {
    ApiBill,
    CreateBillDto,
    AddBillItemDto,
    RecordPaymentDto,
    BillStatus,
    BillingStats
} from "../types/billing";

const fetcher = (url: string) => apiClient(url) as Promise<any>;

export interface BillsQuery {
    search?: string;
    status?: BillStatus;
    patientId?: string;
    admissionId?: string;
    page?: number;
    limit?: number;
}

export interface PaginatedBills {
    data: ApiBill[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/** GET /billing — Paginated list */
export function useBills(query: BillsQuery = {}) {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    if (query.status) params.set("status", query.status);
    if (query.patientId) params.set("patientId", query.patientId);
    if (query.admissionId) params.set("admissionId", query.admissionId);
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));

    const qs = params.toString() ? `?${params.toString()}` : "";

    const { data, error, isLoading, mutate } = useSWR<PaginatedBills>(
        `/billing${qs}`,
        fetcher,
        { keepPreviousData: true }
    );

    return {
        bills: data?.data ?? [],
        total: data?.total ?? 0,
        isLoading,
        error,
        mutate
    };
}

/** GET /billing/:id — Single bill details */
export function useBill(id: string | null) {
    const { data, error, isLoading, mutate } = useSWR<ApiBill>(
        id ? `/billing/${id}` : null,
        fetcher
    );

    return {
        bill: data ?? null,
        isLoading,
        error,
        mutate
    };
}

/** GET /billing/stats — Dashboard KPI Aggregations */
export function useBillingStats(period: 'today' | 'week' | 'month' | 'custom' = 'today', startDate?: string, endDate?: string) {
    const params = new URLSearchParams({ period });
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    const { data, error, isLoading, mutate } = useSWR<BillingStats>(
        `/billing/stats?${params.toString()}`,
        fetcher,
        {
            refreshInterval: 30_000,   // Auto-refresh every 30s
            revalidateOnFocus: true,   // Keep dashboard alive
            keepPreviousData: true     // Smooth transitions
        }
    );

    return {
        stats: data ?? null,
        isLoading,
        error,
        mutate
    };
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export async function createBill(dto: CreateBillDto): Promise<ApiBill> {
    return apiClient<ApiBill>("/billing", {
        method: "POST",
        body: JSON.stringify(dto),
    });
}

export async function addBillItem(billId: string, dto: AddBillItemDto): Promise<ApiBill> {
    return apiClient<ApiBill>(`/billing/${billId}/items`, {
        method: "POST",
        body: JSON.stringify(dto),
    });
}

export async function removeBillItem(billId: string, itemId: string): Promise<ApiBill> {
    return apiClient<ApiBill>(`/billing/${billId}/items/${itemId}`, {
        method: "DELETE",
    });
}

export async function finalizeBill(billId: string): Promise<ApiBill> {
    return apiClient<ApiBill>(`/billing/${billId}/finalize`, {
        method: "POST",
    });
}

export async function recordPayment(billId: string, dto: RecordPaymentDto): Promise<ApiBill> {
    return apiClient<ApiBill>(`/billing/${billId}/payments`, {
        method: "POST",
        body: JSON.stringify(dto),
    });
}

export async function cancelBill(billId: string): Promise<ApiBill> {
    return apiClient<ApiBill>(`/billing/${billId}`, {
        method: "DELETE",
    });
}
