import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

/**
 * Standardizes URL query syncing for lists (Pagination, Search, Filters).
 * Returns current values and setter functions that push directly to the URL.
 */
export function useUrlQuery() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // Standard params extraction
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";

    // Generic getter for module-specific params (e.g. floorId)
    const getParam = useCallback(
        (key: string) => searchParams.get(key) || "",
        [searchParams]
    );

    /**
     * Updates one or more query parameters in the URL
     */
    const setQueryParams = useCallback(
        (params: Record<string, string | number | null | undefined>) => {
            const current = new URLSearchParams(Array.from(searchParams.entries()));

            // Apply updates
            Object.entries(params).forEach(([key, value]) => {
                if (value === null || value === undefined || value === "") {
                    current.delete(key);
                } else {
                    current.set(key, String(value));
                }
            });

            // Special case: if we change search or filter, we should probably reset to page 1
            // Only skip resetting if we are explicitly passing 'page' in this update
            if (!("page" in params) && (params.search !== undefined || params.status !== undefined)) {
                current.set("page", "1");
            }

            // Push new URL without full page reload
            const searchStr = current.toString();
            const query = searchStr ? `?${searchStr}` : "";
            router.push(`${pathname}${query}`, { scroll: false });
        },
        [pathname, router, searchParams]
    );

    return {
        page,
        limit,
        search,
        status,
        getParam,
        setQueryParams,
    };
}
