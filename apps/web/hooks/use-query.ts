import useSWR, { SWRConfiguration } from "swr";
import { apiClient } from "../lib/api-client";

/**
 * Generic GET hook powered by SWR and our API client interceptor.
 * Provides caching, background revalidation, and standard loading states.
 *
 * FIX: Now uses SWR v2's native `isLoading` flag instead of the manual
 * `!data && !error` heuristic, which could falsely stay `true` when an
 * endpoint legitimately returns `null` or `0` as the top-level response body.
 *
 * @param url  The API endpoint (e.g., "/master/floors?page=1") or null to
 *             skip fetching (conditional/deferred queries)
 * @param config  Optional SWR configuration overrides
 */
export function useQuery<T>(url: string | null, config?: SWRConfiguration) {
    const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
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
        // SWR v2 native isLoading: true only while SWR has no data yet AND a
        // request is in flight. Correctly handles null-url (no request = not loading)
        // and responses that return falsy values like 0 or null.
        isLoading,
        isFetching: isValidating,   // True on background refetch (data already cached)
        error,
        mutate, // Expose mutate for manual revalidation after mutations
    };
}
