import useSWR from "swr";
import { apiClient } from "@/lib/api-client";

const fetcher = (url: string) => apiClient(url) as Promise<any>;

/**
 * Fetch settings for a specific category
 */
export function useSettings(category: string) {
    const { data, error, isLoading, mutate } = useSWR<Record<string, any>>(
        category ? `/settings/${category.toLowerCase()}` : null,
        fetcher,
        {
            revalidateOnFocus: false, // Settings rarely change
        }
    );

    return {
        settings: data,
        isLoading,
        error,
        mutate,
    };
}

/**
 * Fetch all settings (grouped by category)
 */
export function useAllSettings() {
    const { data, error, isLoading, mutate } = useSWR<Record<string, any>>(
        `/settings`,
        fetcher,
        {
            revalidateOnFocus: false,
        }
    );

    return {
        allSettings: data,
        isLoading,
        error,
        mutate,
    };
}

/**
 * Update settings for a specific category
 */
export async function updateSettings(category: string, data: Record<string, any>, userId?: string) {
    const payload = userId ? { ...data, changedBy: userId } : data;

    return apiClient<Record<string, any>>(`/settings/${category.toLowerCase()}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}
