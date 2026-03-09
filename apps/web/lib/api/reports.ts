import { useQuery } from "@/hooks/use-query"

// KPI Data Types
export interface ReportKpis {
    totalPatients: number
    bedOccupancy: { occupied: number; total: number; percentage: number }
    nicuOccupancy: { occupied: number; total: number; percentage: number }
    revenueToday: number
    revenueThisMonth: number
    vaccinationsThisMonth: number
    labsThisMonth: number
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

export interface DateRange {
    start?: Date;
    end?: Date;
}

function appendDateParams(url: string, range?: DateRange) {
    if (!range || (!range.start && !range.end)) return url;
    const params = new URLSearchParams();
    if (range.start) params.append("startDate", range.start.toISOString());
    if (range.end) params.append("endDate", range.end.toISOString());

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
}

export function useReportKpis(dateRange?: DateRange) {
    const { data, isLoading, error } = useQuery<ReportKpis>(appendDateParams("/reports/kpis", dateRange))
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

export function useDepartmentCensus(dateRange?: DateRange) {
    const { data, isLoading, error } = useQuery<DepartmentCensusData[]>(appendDateParams("/reports/department-census", dateRange))
    return { data: data || [], isLoading, error }
}

export function useTopDiagnoses(limit = 6, dateRange?: DateRange) {
    const { data, isLoading, error } = useQuery<TopDiagnosisData[]>(appendDateParams(`/reports/top-diagnoses?limit=${limit}`, dateRange))
    return { data: data || [], isLoading, error }
}

export interface VaccinationTrendData {
    day: string
    count: number
}

export function useVaccinationTrend(days = 7) {
    const { data, isLoading, error } = useQuery<VaccinationTrendData[]>(`/reports/vaccination-trend?days=${days}`)
    return { data: data || [], isLoading, error }
}
