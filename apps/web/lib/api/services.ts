import useSWR from "swr";
import { apiClient } from "@/lib/api-client";

const fetcher = (url: string) => apiClient<PaginatedServices>(url);

export interface ApiService {
    id: string;
    code: string;
    name: string;
    department: {
        id: string;
        name: string;
    } | null;
    serviceCategory: {
        id: string;
        name: string;
    } | null;
    basePrice: number | string;
    taxPercent: number | string;
    isActive: boolean;
}

export interface ServicesQuery {
    search?: string;
    categoryId?: string;
    departmentId?: string;
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
    if (query.departmentId) params.set("departmentId", query.departmentId);
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
