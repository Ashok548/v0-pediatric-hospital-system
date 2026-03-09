import { useQuery } from "@/hooks/use-query"

export interface DashboardWorkload {
    inpatients: number
    labReports: number
    prescriptionsToday: number
    pendingReferrals: number
}

export function useDashboardWorkload() {
    const { data, isLoading, error, mutate } = useQuery<DashboardWorkload>("/auth/workload")

    return {
        workload: data,
        isLoading,
        isError: error,
        refreshWorkload: mutate,
    }
}
