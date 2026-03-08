import { useQuery } from "@/hooks/use-query"

// KPI Data Types
export interface ReportKpis {
    totalPatients: number
    bedOccupancy: { occupied: number; total: number; percentage: number }
    nicuOccupancy: { occupied: number; total: number; percentage: number }
    revenueToday: number
    revenueThisMonth: number
}

// Chart Data Types
export interface AdmissionsTrendData {
    month: string
    admissions: number
    discharges: number
}

export interface RevenueTrendData {
    week: string
    revenue: number
    target: number
}

export interface DepartmentCensusData {
    name: string
    value: number
    color: string
}

export interface TopDiagnosisData {
    diagnosis: string
    count: number
    trend: "up" | "down" | "stable"
}

// ─── SWR Hooks ──────────────────────────────────────────────────────────────

export function useReportKpis() {
    const { data, isLoading, error } = useQuery<ReportKpis>("/reports/kpis")
    return { kpis: data, isLoading, error }
}

export function useAdmissionsTrend(months = 6) {
    const { data, isLoading, error } = useQuery<AdmissionsTrendData[]>(`/reports/admissions-trend?months=${months}`)
    return { data: data || [], isLoading, error }
}

export function useRevenueTrend(weeks = 4) {
    const { data, isLoading, error } = useQuery<RevenueTrendData[]>(`/reports/revenue-trend?weeks=${weeks}`)
    return { data: data || [], isLoading, error }
}

export function useDepartmentCensus() {
    const { data, isLoading, error } = useQuery<DepartmentCensusData[]>("/reports/department-census")
    return { data: data || [], isLoading, error }
}

export function useTopDiagnoses(limit = 6) {
    const { data, isLoading, error } = useQuery<TopDiagnosisData[]>(`/reports/top-diagnoses?limit=${limit}`)
    return { data: data || [], isLoading, error }
}
