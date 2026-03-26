import useSWR from "swr";
import { apiClient } from "@/lib/api-client";

const fetcher = (url: string) => apiClient<PaginatedServices>(url);

export interface ApiService {
    id: string;
    code: string;
    name: string;
    category: string;
    subCategory?: string;
    uiGroup: string;
    careType: "OP" | "IP" | "BOTH";
    departments: {
        id: string;
        department: {
            id: string;
            name: string;
        }
    }[];
    basePrice: number | string;
    taxPercent: number | string;
    status: string;
}

export interface ServicesQuery {
    search?: string;
    categoryId?: string;
    category?: string;
    departmentId?: string;
    departmentName?: string;
    careType?: "OP" | "IP" | "BOTH";
    page?: number;
    limit?: number;
}

export interface PaginatedServices {
    data: ApiService[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export function useServices(query: ServicesQuery = {}) {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    if (query.categoryId) params.set("categoryId", query.categoryId);
    if (query.category) params.set("category", query.category);
    if (query.departmentId) params.set("departmentId", query.departmentId);
    if (query.departmentName) params.set("departmentName", query.departmentName);
    if (query.careType) params.set("careType", query.careType);
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));

    const qs = params.toString() ? `?${params.toString()}` : "";

    const { data, error, isLoading } = useSWR<PaginatedServices>(
        `/master/services${qs}`,
        fetcher,
        { keepPreviousData: true }
    );

    return {
        services: data?.data ?? [],
        total: data?.total ?? 0,
        isLoading,
        error
    };
}
