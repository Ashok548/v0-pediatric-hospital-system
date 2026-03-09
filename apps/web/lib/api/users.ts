import useSWR from "swr";
import { apiClient } from "@/lib/api-client";

export function useUsers() {
    const { data, error, isLoading, mutate } = useSWR<any>(
        "/users",
        (url: string) => apiClient(url)
    );
    return { users: data?.data || [], isLoading, error, mutate };
}
