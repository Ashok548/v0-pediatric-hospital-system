import useSWR, { SWRConfiguration } from "swr";
import { apiClient } from "../lib/api-client";

/**
 * Generic GET hook powered by SWR and our API client interceptor.
 * Provides caching, background revalidation, and standard loading states.
 *
 * @param url The API endpoint (e.g., "/master/floors")
 * @param config Optional SWR configuration overrides
 */
export function useQuery<T>(url: string | null, config?: SWRConfiguration) {
    const { data, error, isValidating, mutate } = useSWR<T>(
        url,
        // SWR fetcher function delegates to our configured apiClient
        (endpoint: string) => apiClient<T>(endpoint),
        {
            revalidateOnFocus: true,
            shouldRetryOnError: false, // Don't aggressively retry 400/500s
            ...config,
        }
    );

    return {
        data,
        isLoading: url !== null && !error && !data, // False when url=null (conditional fetch)
        isFetching: isValidating,   // True on background refetch
        error,
        mutate, // Expose mutate for manual optimistic updates
    };
}
