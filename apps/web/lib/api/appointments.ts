import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { Appointment, ApptStatus } from "@carenest/shared-types";

const fetcher = (url: string) => apiClient(url) as Promise<any>;

interface AppointmentsQuery {
    date?: string;
    status?: ApptStatus;
    doctorId?: string;
    search?: string;
    patientId?: string;
    page?: number;
    limit?: number;
}

export interface PaginatedAppointments {
    data: Appointment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/** GET /appointments — list with filters */
export function useAppointments(query: AppointmentsQuery = {}) {
    const params = new URLSearchParams();
    if (query.date) params.set("date", query.date);
    if (query.status) params.set("status", query.status);
    if (query.doctorId) params.set("doctorId", query.doctorId);
    if (query.search) params.set("search", query.search);
    if (query.patientId) params.set("patientId", query.patientId);
    if (query.page) params.set("page", query.page.toString());
    if (query.limit) params.set("limit", query.limit.toString());

    const qs = params.toString() ? `?${params}` : "";

    const { data, error, isLoading, mutate } = useSWR<PaginatedAppointments>(
        `/appointments${qs}`,
        fetcher,
        { keepPreviousData: true }
    );

    return {
        appointments: data?.data || [],
        total: data?.total || 0,
        page: data?.page || 1,
        limit: data?.limit || 50,
        totalPages: data?.totalPages || 0,
        isLoading,
        error,
        mutate,
    };
}

export interface AppointmentStats {
    total: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    noShow: number;
}

/** GET /appointments/stats — KPI counts */
export function useAppointmentStats(date: string) {
    const params = new URLSearchParams();
    if (date) params.set("date", date);

    const qs = params.toString() ? `?${params}` : "";

    const { data, error, isLoading, mutate } = useSWR<AppointmentStats>(
        `/appointments/stats${qs}`,
        fetcher,
        { keepPreviousData: true }
    );

    return {
        stats: data,
        isLoading,
        error,
        mutate,
    };
}

export interface DoctorListMember {
    id: string;
    name: string;
    consultationFee: number;
}

/** GET /appointments/doctors — list of active doctors */
export function useDoctors() {
    const { data, error, isLoading } = useSWR<DoctorListMember[]>(
        `/appointments/doctors`,
        fetcher,
        { revalidateOnFocus: false }
    );
    return {
        doctors: data || [],
        isLoading,
        error,
    };
}

/** GET /appointments/departments */
export function useDepartments() {
    const { data, error, isLoading } = useSWR<string[]>(
        `/appointments/departments`,
        fetcher,
        { revalidateOnFocus: false }
    );
    return { departments: data || [], isLoading, error };
}

/** GET /appointments/types */
export function useAppointmentTypes() {
    const { data, error, isLoading } = useSWR<string[]>(
        `/appointments/types`,
        fetcher,
        { revalidateOnFocus: false }
    );
    return { types: data || [], isLoading, error };
}

/** POST /appointments — Create new appointment */
export async function createAppointment(data: {
    patientId: string;
    doctorId: string;
    department: string;
    appointmentDate: string;
    timeSlot: string;
    type: string;
    duration?: number;
    notes?: string;
    chiefComplaint?: string;
}): Promise<Appointment> {
    return apiClient<Appointment>("/appointments", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

/** PATCH /appointments/:id/status — Update status */
export async function updateAppointmentStatus(id: string, status: ApptStatus): Promise<Appointment> {
    return apiClient<Appointment>(`/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
}

/** PATCH /appointments/:id/reschedule */
export async function rescheduleAppointment(id: string, data: { appointmentDate: string; timeSlot: string; doctorId: string }): Promise<Appointment> {
    return apiClient<Appointment>(`/appointments/${id}/reschedule`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

/** DELETE /appointments/:id */
export async function deleteAppointment(id: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/appointments/${id}`, {
        method: "DELETE",
    });
}

/** Calendar data for a month */
export interface MonthlyCalendarData {
    year: number;
    month: number;
    days: Record<number, number>; // day -> count
}

/** GET /appointments/calendar — daily appointment counts for a month */
export function useMonthlyCalendar(month?: string, doctorId?: string) {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (doctorId) params.set("doctorId", doctorId);

    const qs = params.toString() ? `?${params}` : "";
    const { data, error, isLoading } = useSWR<MonthlyCalendarData>(
        `/appointments/calendar${qs}`,
        fetcher,
        { revalidateOnFocus: false }
    );
    return {
        calendar: data,
        isLoading,
        error,
    };
}

export function useLastVisit(patientId: string | null) {
    const { data, error, isLoading } = useSWR<{
        doctorId: string;
        doctorName: string;
        department: string;
        type: string;
        appointmentDate: string;
    } | null>(
        patientId ? `/appointments/last-visit/${patientId}` : null,
        fetcher,
        { revalidateOnFocus: false }
    );
    return { lastVisit: data ?? null, isLoading, error };
}
