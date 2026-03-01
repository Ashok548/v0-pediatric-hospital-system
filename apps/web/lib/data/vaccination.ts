// ─────────────────────────────────────────────────────────────────────────────
// lib/data/vaccination.ts
// Mock vaccination patient list + async data functions.
//
// TO MIGRATE TO API: replace each async function body with fetch().
// ─────────────────────────────────────────────────────────────────────────────

import type { VaccinationPatient } from "./types"

// ─── Mock Data ───────────────────────────────────────────────────────────────
export const vaccinationPatients: VaccinationPatient[] = [
    { id: "CN-2026-0001", name: "Arya Sharma", age: "11 months", gender: "F", dob: "Mar 18, 2025", doctor: "Dr. Priya Reddy", lastVisit: "Feb 15, 2026", nextDue: "Mar 18, 2026", nextVaccine: "OPV + IPV Booster", vaccinesGiven: 8, totalVaccines: 14, status: "due-today" },
    { id: "CN-2026-0003", name: "Anika Patel", age: "2 months", gender: "F", dob: "Dec 01, 2024", doctor: "Dr. Meera Iyer", lastVisit: "Jan 10, 2026", nextDue: "Feb 10, 2026", nextVaccine: "DTP + Hib + IPV", vaccinesGiven: 2, totalVaccines: 14, status: "overdue" },
    { id: "CN-2026-0007", name: "Diya Gupta", age: "7 weeks", gender: "F", dob: "Jan 01, 2026", doctor: "Dr. Priya Reddy", lastVisit: "Jan 15, 2026", nextDue: "Feb 28, 2026", nextVaccine: "BCG + HepB + OPV", vaccinesGiven: 1, totalVaccines: 14, status: "overdue" },
    { id: "CN-2026-0006", name: "Ishaan Desai", age: "1y 4mo", gender: "M", dob: "Oct 01, 2024", doctor: "Dr. Meera Iyer", lastVisit: "Feb 05, 2026", nextDue: "Apr 01, 2026", nextVaccine: "Typhoid + Varicella", vaccinesGiven: 10, totalVaccines: 14, status: "upcoming" },
    { id: "CN-2026-0010", name: "Kabir Rao", age: "1 year", gender: "M", dob: "Feb 22, 2025", doctor: "Dr. Priya Reddy", lastVisit: "Feb 22, 2026", nextDue: "Feb 22, 2026", nextVaccine: "MMR + Varicella", vaccinesGiven: 9, totalVaccines: 14, status: "due-today" },
    { id: "CN-2026-0005", name: "Saanvi Nair", age: "7 years", gender: "F", dob: "Feb 22, 2019", doctor: "Dr. Anil Kumar", lastVisit: "Feb 10, 2026", nextDue: "Feb 22, 2027", nextVaccine: "Tdap Booster", vaccinesGiven: 14, totalVaccines: 14, status: "up-to-date" },
    { id: "CN-2026-0002", name: "Rohan Mehta", age: "5y 2mo", gender: "M", dob: "Jun 04, 2020", doctor: "Dr. Anil Kumar", lastVisit: "Jan 20, 2026", nextDue: "Jun 04, 2026", nextVaccine: "Typhoid Booster", vaccinesGiven: 13, totalVaccines: 14, status: "upcoming" },
    { id: "CN-2026-0011", name: "Anaya Verma", age: "6 months", gender: "F", dob: "Aug 22, 2025", doctor: "Dr. Meera Iyer", lastVisit: "Feb 22, 2026", nextDue: "Feb 22, 2026", nextVaccine: "6-in-1 Booster", vaccinesGiven: 5, totalVaccines: 14, status: "due-today" },
    { id: "CN-2026-0004", name: "Vivaan Reddy", age: "3y 3mo", gender: "M", dob: "Nov 14, 2022", doctor: "Dr. Priya Reddy", lastVisit: "Jan 15, 2026", nextDue: "May 14, 2026", nextVaccine: "Hepatitis A", vaccinesGiven: 12, totalVaccines: 14, status: "upcoming" },
    { id: "CN-2026-0008", name: "Aarav Singh", age: "10y 8mo", gender: "M", dob: "Jun 02, 2015", doctor: "Dr. Anil Kumar", lastVisit: "Feb 01, 2026", nextDue: "Jun 02, 2026", nextVaccine: "HPV Vaccine (Dose 2)", vaccinesGiven: 14, totalVaccines: 14, status: "up-to-date" },
    { id: "CN-2026-0013", name: "Kiara Bhat", age: "8y 11mo", gender: "F", dob: "Mar 01, 2017", doctor: "Dr. Priya Reddy", lastVisit: "Sep 15, 2025", nextDue: "Mar 01, 2026", nextVaccine: "HPV Vaccine (Dose 1)", vaccinesGiven: 14, totalVaccines: 14, status: "due-today" },
    { id: "CN-2026-0014", name: "Advait Menon", age: "2 months", gender: "M", dob: "Dec 15, 2025", doctor: "Dr. Meera Iyer", lastVisit: "Jan 20, 2026", nextDue: "Feb 20, 2026", nextVaccine: "DTP + Hib + IPV + HepB", vaccinesGiven: 1, totalVaccines: 14, status: "overdue" },
    { id: "CN-2026-0009", name: "Myra Joshi", age: "4y 3mo", gender: "F", dob: "Nov 01, 2021", doctor: "Dr. Meera Iyer", lastVisit: "Nov 10, 2025", nextDue: "Nov 01, 2026", nextVaccine: "DTP Booster", vaccinesGiven: 13, totalVaccines: 14, status: "up-to-date" },
    { id: "CN-2026-0012", name: "Reyansh Tiwari", age: "6y 5mo", gender: "M", dob: "Sep 01, 2019", doctor: "Dr. Anil Kumar", lastVisit: "Feb 20, 2026", nextDue: "Sep 01, 2026", nextVaccine: "Tdap", vaccinesGiven: 14, totalVaccines: 14, status: "up-to-date" },
    { id: "CN-2026-0015", name: "Prisha Kulkarni", age: "12y 1mo", gender: "F", dob: "Jan 22, 2014", doctor: "Dr. Anil Kumar", lastVisit: "Jan 22, 2026", nextDue: "Jan 22, 2027", nextVaccine: "Tdap Booster", vaccinesGiven: 14, totalVaccines: 14, status: "up-to-date" },
]

// ─── Async Data Functions ─────────────────────────────────────────────────────

export async function getVaccinationPatients(): Promise<VaccinationPatient[]> {
    return vaccinationPatients
}

export async function getVaccinationPatientById(id: string): Promise<VaccinationPatient | null> {
    return vaccinationPatients.find(p => p.id === id) ?? null
}

export async function getVaccinationCounts() {
    return {
        dueToday: vaccinationPatients.filter(p => p.status === "due-today").length,
        overdue: vaccinationPatients.filter(p => p.status === "overdue").length,
        upcoming: vaccinationPatients.filter(p => p.status === "upcoming").length,
        upToDate: vaccinationPatients.filter(p => p.status === "up-to-date").length,
    }
}
