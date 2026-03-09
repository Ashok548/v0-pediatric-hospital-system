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
}

/** GET /appointments — list with filters */
export function useAppointments(query: AppointmentsQuery = {}) {
    const params = new URLSearchParams();
    if (query.date) params.set("date", query.date);
    if (query.status) params.set("status", query.status);
    if (query.doctorId) params.set("doctorId", query.doctorId);
    if (query.search) params.set("search", query.search);
    if (query.patientId) params.set("patientId", query.patientId);

    const qs = params.toString() ? `?${params}` : "";

    const { data, error, isLoading, mutate } = useSWR<Appointment[]>(
        `/appointments${qs}`,
        fetcher,
        { keepPreviousData: true }
    );

    return {
        appointments: data || [],
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
