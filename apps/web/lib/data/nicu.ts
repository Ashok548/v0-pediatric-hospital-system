// ─────────────────────────────────────────────────────────────────────────────
// lib/data/nicu.ts
// Mock NICU baby data + async data functions.
//
// TO MIGRATE TO API: replace each async function body with fetch().
// ─────────────────────────────────────────────────────────────────────────────
export type BabyStatus = "stable" | "warning" | "critical"
export interface NicuBaby {
    id: string
    name: string
    bed: string
    gestationalAge: string
    weight: string
    status: BabyStatus
    vitals: {
        heartRate: number
        spo2: number
        temperature: number
    }
    alerts: string[]
    admittedDate: string
    doctor: string
}
// ─── Mock Data ───────────────────────────────────────────────────────────────
export const nicuBabies: NicuBaby[] = [
    { id: "N-001", name: "Baby Arjun Gupta", bed: "N-01", gestationalAge: "32 weeks + 4 days", weight: "1.8 kg", status: "critical", vitals: { heartRate: 188, spo2: 86, temperature: 36.1 }, alerts: ["SpO2 Low", "Tachycardia"], admittedDate: "Feb 18, 2026", doctor: "Meena Iyer" },
    { id: "N-002", name: "Baby Aisha Khan", bed: "N-02", gestationalAge: "34 weeks + 1 day", weight: "2.1 kg", status: "stable", vitals: { heartRate: 142, spo2: 96, temperature: 36.8 }, alerts: [], admittedDate: "Feb 19, 2026", doctor: "Rajiv Sharma" },
    { id: "N-003", name: "Baby Vihaan Reddy", bed: "N-03", gestationalAge: "28 weeks + 6 days", weight: "1.1 kg", status: "critical", vitals: { heartRate: 192, spo2: 84, temperature: 35.8 }, alerts: ["Ventilator", "SpO2 Critical", "Hypothermia"], admittedDate: "Feb 15, 2026", doctor: "Meena Iyer" },
    { id: "N-004", name: "Baby Saanvi Patel", bed: "N-04", gestationalAge: "36 weeks + 0 days", weight: "2.4 kg", status: "stable", vitals: { heartRate: 138, spo2: 97, temperature: 36.7 }, alerts: [], admittedDate: "Feb 21, 2026", doctor: "Priya Reddy" },
    { id: "N-005", name: "Baby Kabir Singh", bed: "N-05", gestationalAge: "30 weeks + 2 days", weight: "1.4 kg", status: "warning", vitals: { heartRate: 168, spo2: 91, temperature: 37.6 }, alerts: ["SpO2 Borderline"], admittedDate: "Feb 17, 2026", doctor: "Rajiv Sharma" },
    { id: "N-006", name: "Baby Myra Nair", bed: "N-06", gestationalAge: "33 weeks + 5 days", weight: "1.9 kg", status: "stable", vitals: { heartRate: 145, spo2: 95, temperature: 36.6 }, alerts: [], admittedDate: "Feb 20, 2026", doctor: "Meena Iyer" },
    { id: "N-007", name: "Baby Reyansh Das", bed: "N-07", gestationalAge: "29 weeks + 3 days", weight: "1.2 kg", status: "warning", vitals: { heartRate: 172, spo2: 90, temperature: 37.4 }, alerts: ["Elevated HR"], admittedDate: "Feb 16, 2026", doctor: "Priya Reddy" },
    { id: "N-008", name: "Baby Ananya Joshi", bed: "N-08", gestationalAge: "35 weeks + 2 days", weight: "2.3 kg", status: "stable", vitals: { heartRate: 136, spo2: 98, temperature: 36.9 }, alerts: [], admittedDate: "Feb 21, 2026", doctor: "Rajiv Sharma" },
    { id: "N-009", name: "Baby Ishaan Mehta", bed: "N-09", gestationalAge: "31 weeks + 0 days", weight: "1.5 kg", status: "warning", vitals: { heartRate: 162, spo2: 89, temperature: 37.2 }, alerts: ["SpO2 Low"], admittedDate: "Feb 18, 2026", doctor: "Meena Iyer" },
    { id: "N-010", name: "Baby Priya Kumar", bed: "N-10", gestationalAge: "33 weeks + 3 days", weight: "1.7 kg", status: "stable", vitals: { heartRate: 149, spo2: 96, temperature: 36.5 }, alerts: [], admittedDate: "Feb 19, 2026", doctor: "Priya Reddy" },
    { id: "N-011", name: "Baby Riya Sharma", bed: "N-11", gestationalAge: "27 weeks + 5 days", weight: "0.9 kg", status: "critical", vitals: { heartRate: 195, spo2: 82, temperature: 35.6 }, alerts: ["Ventilator", "Bradycardia", "Hypothermia"], admittedDate: "Feb 14, 2026", doctor: "Rajiv Sharma" },
    { id: "N-012", name: "Baby Aryan Patel", bed: "N-12", gestationalAge: "34 weeks + 4 days", weight: "2.2 kg", status: "stable", vitals: { heartRate: 141, spo2: 97, temperature: 36.8 }, alerts: [], admittedDate: "Feb 22, 2026", doctor: "Meena Iyer" },
]

// ─── Async Data Functions ─────────────────────────────────────────────────────

export async function getNicuBabies(): Promise<NicuBaby[]> {
    return nicuBabies
}

export async function getNicuBabiesByStatus(status: BabyStatus): Promise<NicuBaby[]> {
    return nicuBabies.filter(b => b.status === status)
}

export async function getNicuBabyById(id: string): Promise<NicuBaby | null> {
    return nicuBabies.find(b => b.id === id) ?? null
}

export async function getNicuCounts() {
    return {
        total: nicuBabies.length,
        critical: nicuBabies.filter(b => b.status === "critical").length,
        warning: nicuBabies.filter(b => b.status === "warning").length,
        stable: nicuBabies.filter(b => b.status === "stable").length,
    }
}
