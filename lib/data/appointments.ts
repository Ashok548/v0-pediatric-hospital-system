// ─────────────────────────────────────────────────────────────────────────────
// lib/data/appointments.ts
// Mock appointment data + async data functions.
//
// TO MIGRATE TO API: replace the body of each async function with a fetch().
//   Example:
//     export async function getAppointments() {
//       const res = await fetch("/api/appointments")
//       return res.json() as Promise<Appointment[]>
//     }
// ─────────────────────────────────────────────────────────────────────────────

import type { Appointment, ApptStatus } from "./types"

// ─── Mock Data ───────────────────────────────────────────────────────────────
export const appointments: Appointment[] = [
    { id: "A-001", patientName: "Rohan Mehta", uhid: "CN-2026-0002", age: "5y 2mo", gender: "M", doctor: "Dr. Anil Kumar", department: "General Paediatrics", time: "09:00", duration: 20, status: "Completed", type: "Follow-up", token: 1 },
    { id: "A-002", patientName: "Saanvi Nair", uhid: "CN-2026-0005", age: "7y", gender: "F", doctor: "Dr. Anil Kumar", department: "General Paediatrics", time: "09:20", duration: 20, status: "Completed", type: "Review", token: 2 },
    { id: "A-003", patientName: "Kabir Rao", uhid: "CN-2026-0010", age: "2y", gender: "M", doctor: "Dr. Priya Reddy", department: "Neonatology", time: "09:30", duration: 30, status: "Completed", type: "Consultation", token: 3 },
    { id: "A-004", patientName: "Kiara Bhat", uhid: "CN-2026-0013", age: "8y 11mo", gender: "F", doctor: "Dr. Priya Reddy", department: "Neonatology", time: "10:00", duration: 20, status: "In Progress", type: "Follow-up", token: 4 },
    { id: "A-005", patientName: "Ishaan Desai", uhid: "CN-2026-0006", age: "1y 4mo", gender: "M", doctor: "Dr. Meera Iyer", department: "Paediatric Cardiology", time: "10:30", duration: 30, status: "Scheduled", type: "Consultation", token: 5 },
    { id: "A-006", patientName: "Anaya Verma", uhid: "CN-2026-0011", age: "6mo", gender: "F", doctor: "Dr. Meera Iyer", department: "Paediatric Cardiology", time: "11:00", duration: 20, status: "Scheduled", type: "Review", token: 6 },
    { id: "A-007", patientName: "Myra Joshi", uhid: "CN-2026-0009", age: "4y 3mo", gender: "F", doctor: "Dr. Anil Kumar", department: "General Paediatrics", time: "11:30", duration: 20, status: "Scheduled", type: "Follow-up", token: 7 },
    { id: "A-008", patientName: "Reyansh Tiwari", uhid: "CN-2026-0012", age: "6y 5mo", gender: "M", doctor: "Dr. Priya Reddy", department: "Neonatology", time: "12:00", duration: 30, status: "Scheduled", type: "Consultation", token: 8 },
    { id: "A-009", patientName: "Diya Gupta", uhid: "CN-2026-0007", age: "1mo", gender: "F", doctor: "Dr. Meera Iyer", department: "Paediatric Cardiology", time: "12:30", duration: 20, status: "No Show", type: "Review", token: 9 },
    { id: "A-010", patientName: "Aarav Singh", uhid: "CN-2026-0008", age: "10y 8mo", gender: "M", doctor: "Dr. Anil Kumar", department: "General Paediatrics", time: "14:00", duration: 30, status: "Scheduled", type: "Consultation", token: 10 },
    { id: "A-011", patientName: "Prisha Kulkarni", uhid: "CN-2026-0015", age: "12y 1mo", gender: "F", doctor: "Dr. Priya Reddy", department: "Neonatology", time: "14:30", duration: 20, status: "Scheduled", type: "Follow-up", token: 11 },
    { id: "A-012", patientName: "Advait Menon", uhid: "CN-2026-0014", age: "2mo", gender: "M", doctor: "Dr. Meera Iyer", department: "Paediatric Cardiology", time: "15:00", duration: 30, status: "Cancelled", type: "Consultation", token: 12 },
    { id: "A-013", patientName: "Vivaan Reddy", uhid: "CN-2026-0004", age: "3y 7mo", gender: "M", doctor: "Dr. Anil Kumar", department: "General Paediatrics", time: "15:30", duration: 20, status: "Scheduled", type: "Review", token: 13 },
    { id: "A-014", patientName: "Arya Sharma", uhid: "CN-2026-0001", age: "11mo", gender: "F", doctor: "Dr. Priya Reddy", department: "Neonatology", time: "16:00", duration: 20, status: "Scheduled", type: "Follow-up", token: 14 },
]

// ─── Async Data Functions (swap bodies for fetch() during API migration) ─────

export async function getAppointments(): Promise<Appointment[]> {
    return appointments
}

export async function getAppointmentsByStatus(status: ApptStatus): Promise<Appointment[]> {
    return appointments.filter(a => a.status === status)
}

export async function getAppointmentsByDoctor(doctor: string): Promise<Appointment[]> {
    return appointments.filter(a => a.doctor === doctor)
}

export async function getAppointmentCounts() {
    return {
        all: appointments.length,
        Scheduled: appointments.filter(a => a.status === "Scheduled").length,
        "In Progress": appointments.filter(a => a.status === "In Progress").length,
        Completed: appointments.filter(a => a.status === "Completed").length,
        Cancelled: appointments.filter(a => a.status === "Cancelled").length,
        "No Show": appointments.filter(a => a.status === "No Show").length,
    }
}
