// ─────────────────────────────────────────────────────────────────────────────
// lib/data/patients.ts
// Mock patient data + async data functions.
//
// TO MIGRATE TO API: replace each async function body with a fetch() call.
// ─────────────────────────────────────────────────────────────────────────────

import type { Patient, PatientDetail, PatientStatus } from "./types"

// ─── Helpers ─────────────────────────────────────────────────────────────────
const now = new Date()
function minsAgo(m: number) { return new Date(now.getTime() - m * 60000) }

// ─── Patient List Mock Data ───────────────────────────────────────────────────
export const patients: Patient[] = [
    { uhid: "CN-2026-0001", firstName: "Arya", lastName: "Sharma", ageYears: 0, ageMonths: 11, gender: "F", guardianName: "Vikram Sharma", status: "IP", doctor: "Dr. Priya Reddy", lastModified: minsAgo(3), phone: "9876543210", wardBed: "Peds-W1 / B-04" },
    { uhid: "CN-2026-0002", firstName: "Rohan", lastName: "Mehta", ageYears: 5, ageMonths: 2, gender: "M", guardianName: "Sunita Mehta", status: "OP", doctor: "Dr. Anil Kumar", lastModified: minsAgo(12), phone: "9876543211" },
    { uhid: "CN-2026-0003", firstName: "Anika", lastName: "Patel", ageYears: 0, ageMonths: 3, gender: "F", guardianName: "Raj Patel", status: "NICU", doctor: "Dr. Meera Iyer", lastModified: minsAgo(5), phone: "9876543212", wardBed: "NICU / Inc-07" },
    { uhid: "CN-2026-0004", firstName: "Vivaan", lastName: "Reddy", ageYears: 3, ageMonths: 7, gender: "M", guardianName: "Priya Reddy", status: "Discharged", doctor: "Dr. Priya Reddy", lastModified: minsAgo(120), phone: "9876543213" },
    { uhid: "CN-2026-0005", firstName: "Saanvi", lastName: "Nair", ageYears: 7, ageMonths: 0, gender: "F", guardianName: "Ajay Nair", status: "IP", doctor: "Dr. Anil Kumar", lastModified: minsAgo(30), phone: "9876543214", wardBed: "Peds-W2 / B-11" },
    { uhid: "CN-2026-0006", firstName: "Ishaan", lastName: "Desai", ageYears: 1, ageMonths: 4, gender: "M", guardianName: "Kavita Desai", status: "OP", doctor: "Dr. Meera Iyer", lastModified: minsAgo(45), phone: "9876543215" },
    { uhid: "CN-2026-0007", firstName: "Diya", lastName: "Gupta", ageYears: 0, ageMonths: 1, gender: "F", guardianName: "Mohan Gupta", status: "NICU", doctor: "Dr. Priya Reddy", lastModified: minsAgo(2), phone: "9876543216", wardBed: "NICU / Inc-02" },
    { uhid: "CN-2026-0008", firstName: "Aarav", lastName: "Singh", ageYears: 10, ageMonths: 8, gender: "M", guardianName: "Deepak Singh", status: "IP", doctor: "Dr. Anil Kumar", lastModified: minsAgo(90), phone: "9876543217", wardBed: "Peds-W1 / B-09" },
    { uhid: "CN-2026-0009", firstName: "Myra", lastName: "Joshi", ageYears: 4, ageMonths: 3, gender: "F", guardianName: "Rahul Joshi", status: "Discharged", doctor: "Dr. Meera Iyer", lastModified: minsAgo(300), phone: "9876543218" },
    { uhid: "CN-2026-0010", firstName: "Kabir", lastName: "Rao", ageYears: 2, ageMonths: 0, gender: "M", guardianName: "Lakshmi Rao", status: "OP", doctor: "Dr. Priya Reddy", lastModified: minsAgo(60), phone: "9876543219" },
    { uhid: "CN-2026-0011", firstName: "Anaya", lastName: "Verma", ageYears: 0, ageMonths: 6, gender: "F", guardianName: "Suresh Verma", status: "NICU", doctor: "Dr. Meera Iyer", lastModified: minsAgo(8), phone: "9876543220", wardBed: "NICU / Inc-12" },
    { uhid: "CN-2026-0012", firstName: "Reyansh", lastName: "Tiwari", ageYears: 6, ageMonths: 5, gender: "M", guardianName: "Neha Tiwari", status: "IP", doctor: "Dr. Anil Kumar", lastModified: minsAgo(150), phone: "9876543221", wardBed: "PICU / B-03" },
    { uhid: "CN-2026-0013", firstName: "Kiara", lastName: "Bhat", ageYears: 8, ageMonths: 11, gender: "F", guardianName: "Ganesh Bhat", status: "OP", doctor: "Dr. Priya Reddy", lastModified: minsAgo(200), phone: "9876543222" },
    { uhid: "CN-2026-0014", firstName: "Advait", lastName: "Menon", ageYears: 0, ageMonths: 2, gender: "M", guardianName: "Sanjay Menon", status: "NICU", doctor: "Dr. Meera Iyer", lastModified: minsAgo(1), phone: "9876543223", wardBed: "NICU / Inc-18" },
    { uhid: "CN-2026-0015", firstName: "Prisha", lastName: "Kulkarni", ageYears: 12, ageMonths: 1, gender: "F", guardianName: "Amit Kulkarni", status: "Discharged", doctor: "Dr. Anil Kumar", lastModified: minsAgo(1440), phone: "9876543224" },
]

// ─── Patient Detail Mock Data (keyed by UHID) ─────────────────────────────────
export const patientDetails: Record<string, PatientDetail> = {
    "CN-2026-0001": { uhid: "CN-2026-0001", name: "Arya Sharma", dob: "18 Mar 2025", age: "11 months", gender: "F", bloodGroup: "B+", weight: "7.2 kg", guardian: "Vikram Sharma", phone: "+91 98765 43210", doctor: "Dr. Priya Reddy", status: "IP", wardBed: "Peds-W1 / B-04", diagnosis: "Pneumonia with respiratory distress", admissionDate: "20 Feb 2026" },
    "CN-2026-0002": { uhid: "CN-2026-0002", name: "Rohan Mehta", dob: "04 Jun 2021", age: "4y 8mo", gender: "M", bloodGroup: "O+", weight: "18.4 kg", guardian: "Sunita Mehta", phone: "+91 98765 43211", doctor: "Dr. Anil Kumar", status: "OP", diagnosis: "Acute Otitis Media" },
    "CN-2026-0003": { uhid: "CN-2026-0003", name: "Anika Patel", dob: "01 Dec 2024", age: "2 months", gender: "F", bloodGroup: "A+", weight: "4.1 kg", guardian: "Raj Patel", phone: "+91 98765 43212", doctor: "Dr. Meera Iyer", status: "NICU", wardBed: "NICU / Inc-07", diagnosis: "Preterm with respiratory support", admissionDate: "10 Feb 2026" },
    "CN-2026-0004": { uhid: "CN-2026-0004", name: "Vivaan Reddy", dob: "14 Nov 2022", age: "3y 3mo", gender: "M", bloodGroup: "AB+", weight: "14.0 kg", guardian: "Priya Reddy", phone: "+91 98765 43213", doctor: "Dr. Priya Reddy", status: "Discharged", diagnosis: "Febrile seizures" },
    "CN-2026-0005": { uhid: "CN-2026-0005", name: "Saanvi Nair", dob: "22 Feb 2019", age: "7 years", gender: "F", bloodGroup: "B-", weight: "21.5 kg", guardian: "Ajay Nair", phone: "+91 98765 43214", doctor: "Dr. Anil Kumar", status: "IP", wardBed: "Peds-W2 / B-11", diagnosis: "Bronchial asthma – acute exacerbation", admissionDate: "21 Feb 2026" },
    "CN-2026-0006": { uhid: "CN-2026-0006", name: "Ishaan Desai", dob: "01 Oct 2024", age: "1y 4mo", gender: "M", bloodGroup: "O-", weight: "9.8 kg", guardian: "Kavita Desai", phone: "+91 98765 43215", doctor: "Dr. Meera Iyer", status: "OP", diagnosis: "Gastroenteritis" },
    "CN-2026-0007": { uhid: "CN-2026-0007", name: "Diya Gupta", dob: "01 Jan 2026", age: "7 weeks", gender: "F", bloodGroup: "A-", weight: "3.6 kg", guardian: "Mohan Gupta", phone: "+91 98765 43216", doctor: "Dr. Priya Reddy", status: "NICU", wardBed: "NICU / Inc-02", diagnosis: "Neonatal jaundice", admissionDate: "09 Feb 2026" },
    "CN-2026-0008": { uhid: "CN-2026-0008", name: "Aarav Singh", dob: "02 Jun 2015", age: "10y 8mo", gender: "M", bloodGroup: "B+", weight: "34.2 kg", guardian: "Deepak Singh", phone: "+91 98765 43217", doctor: "Dr. Anil Kumar", status: "IP", wardBed: "Peds-W1 / B-09", diagnosis: "Appendicitis – post-op Day 2", admissionDate: "20 Feb 2026" },
    "CN-2026-0009": { uhid: "CN-2026-0009", name: "Myra Joshi", dob: "01 Nov 2021", age: "4y 3mo", gender: "F", bloodGroup: "O+", weight: "15.2 kg", guardian: "Rahul Joshi", phone: "+91 98765 43218", doctor: "Dr. Meera Iyer", status: "Discharged", diagnosis: "Urinary tract infection" },
    "CN-2026-0010": { uhid: "CN-2026-0010", name: "Kabir Rao", dob: "22 Feb 2024", age: "1 year", gender: "M", bloodGroup: "AB-", weight: "9.2 kg", guardian: "Lakshmi Rao", phone: "+91 98765 43219", doctor: "Dr. Priya Reddy", status: "OP", diagnosis: "Routine developmental review" },
    "CN-2026-0011": { uhid: "CN-2026-0011", name: "Anaya Verma", dob: "22 Aug 2025", age: "6 months", gender: "F", bloodGroup: "A+", weight: "6.1 kg", guardian: "Suresh Verma", phone: "+91 98765 43220", doctor: "Dr. Meera Iyer", status: "NICU", wardBed: "NICU / Inc-12", diagnosis: "Bronchiolitis – RSV positive", admissionDate: "18 Feb 2026" },
    "CN-2026-0012": { uhid: "CN-2026-0012", name: "Reyansh Tiwari", dob: "01 Sep 2019", age: "6y 5mo", gender: "M", bloodGroup: "B+", weight: "20.0 kg", guardian: "Neha Tiwari", phone: "+91 98765 43221", doctor: "Dr. Anil Kumar", status: "IP", wardBed: "PICU / B-03", diagnosis: "Diabetic ketoacidosis", admissionDate: "19 Feb 2026" },
    "CN-2026-0013": { uhid: "CN-2026-0013", name: "Kiara Bhat", dob: "01 Mar 2017", age: "8y 11mo", gender: "F", bloodGroup: "O+", weight: "28.0 kg", guardian: "Ganesh Bhat", phone: "+91 98765 43222", doctor: "Dr. Priya Reddy", status: "OP", diagnosis: "Allergic rhinitis follow-up" },
    "CN-2026-0014": { uhid: "CN-2026-0014", name: "Advait Menon", dob: "15 Dec 2025", age: "2 months", gender: "M", bloodGroup: "A+", weight: "3.9 kg", guardian: "Sanjay Menon", phone: "+91 98765 43223", doctor: "Dr. Meera Iyer", status: "NICU", wardBed: "NICU / Inc-18", diagnosis: "Sepsis – Day 2", admissionDate: "21 Feb 2026" },
    "CN-2026-0015": { uhid: "CN-2026-0015", name: "Prisha Kulkarni", dob: "22 Jan 2014", age: "12y 1mo", gender: "F", bloodGroup: "B-", weight: "41.0 kg", guardian: "Amit Kulkarni", phone: "+91 98765 43224", doctor: "Dr. Anil Kumar", status: "Discharged", diagnosis: "Typhoid fever" },
}

// ─── Async Data Functions ─────────────────────────────────────────────────────

export async function getPatients(): Promise<Patient[]> {
    return patients
}

export async function getPatientsByStatus(status: PatientStatus): Promise<Patient[]> {
    return patients.filter(p => p.status === status)
}

export async function getPatientById(uhid: string): Promise<PatientDetail | null> {
    return patientDetails[uhid] ?? null
}

export async function searchPatients(query: string): Promise<Patient[]> {
    const q = query.toLowerCase()
    return patients.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.uhid.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.guardianName.toLowerCase().includes(q)
    )
}

export async function getPatientCounts() {
    return {
        all: patients.length,
        OP: patients.filter(p => p.status === "OP").length,
        IP: patients.filter(p => p.status === "IP").length,
        NICU: patients.filter(p => p.status === "NICU").length,
        Discharged: patients.filter(p => p.status === "Discharged").length,
    }
}
