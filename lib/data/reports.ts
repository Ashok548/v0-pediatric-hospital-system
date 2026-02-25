// ─────────────────────────────────────────────────────────────────────────────
// lib/data/reports.ts
// Mock reports / analytics data + async data functions.
//
// TO MIGRATE TO API: replace each async function body with fetch().
// ─────────────────────────────────────────────────────────────────────────────

import type { ReportKpi } from "./types"

// ─── KPI Data ────────────────────────────────────────────────────────────────
export const reportKpis: ReportKpi[] = [
    { label: "Total OPD Visits", value: 1842, change: "+12.4%", positive: true },
    { label: "Total Admissions", value: 284, change: "+5.7%", positive: true },
    { label: "Avg Length of Stay", value: "4.2 days", change: "-0.3d", positive: true },
    { label: "Bed Occupancy Rate", value: "78%", change: "+3.2%", positive: false },
    { label: "NICU Occupancy", value: "91%", change: "+6.4%", positive: false },
    { label: "Patient Satisfaction", value: "4.7/5", change: "+0.2", positive: true },
]

// ─── Department Visit Data (for bar chart) ────────────────────────────────────
export const departmentData = [
    { dept: "Gen. Paeds", visits: 620, admissions: 88 },
    { dept: "Neonatology", visits: 380, admissions: 72 },
    { dept: "Cardiology", visits: 210, admissions: 34 },
    { dept: "NICU", visits: 148, admissions: 48 },
    { dept: "Neurology", visits: 186, admissions: 22 },
    { dept: "Orthopaeds", visits: 155, admissions: 10 },
    { dept: "Oncology", visits: 82, admissions: 6 },
    { dept: "Pulmonology", visits: 61, admissions: 4 },
]

// ─── Age-group Distribution (for pie chart) ───────────────────────────────────
export const ageGroupData = [
    { group: "0-1 yr", count: 312, color: "#6366f1" },
    { group: "1-3 yr", count: 244, color: "#8b5cf6" },
    { group: "3-6 yr", count: 218, color: "#a78bfa" },
    { group: "6-12 yr", count: 196, color: "#c4b5fd" },
    { group: "12+ yr", count: 88, color: "#ddd6fe" },
]

// ─── Monthly Trend Data (for line chart) ─────────────────────────────────────
export const monthlyTrendData = [
    { month: "Sep", opd: 1420, admissions: 198 },
    { month: "Oct", opd: 1564, admissions: 221 },
    { month: "Nov", opd: 1698, admissions: 248 },
    { month: "Dec", opd: 1592, admissions: 234 },
    { month: "Jan", opd: 1742, admissions: 261 },
    { month: "Feb", opd: 1842, admissions: 284 },
]

// ─── Top Diagnoses ────────────────────────────────────────────────────────────
export const topDiagnoses = [
    { rank: 1, name: "Acute Respiratory Infection", icd: "J22", count: 284, pct: 15.4 },
    { rank: 2, name: "Bronchopneumonia", icd: "J18.0", count: 196, pct: 10.6 },
    { rank: 3, name: "Acute Gastroenteritis", icd: "A09", count: 168, pct: 9.1 },
    { rank: 4, name: "Febrile Seizures", icd: "R56.0", count: 124, pct: 6.7 },
    { rank: 5, name: "Dengue Fever", icd: "A97", count: 112, pct: 6.1 },
    { rank: 6, name: "Neonatal Jaundice", icd: "P59", count: 98, pct: 5.3 },
    { rank: 7, name: "Urinary Tract Infection", icd: "N39.0", count: 88, pct: 4.8 },
    { rank: 8, name: "Bronchial Asthma", icd: "J45", count: 76, pct: 4.1 },
]

// ─── Async Data Functions ─────────────────────────────────────────────────────

export async function getReportKpis(): Promise<ReportKpi[]> {
    return reportKpis
}

export async function getDepartmentData(): Promise<typeof departmentData> {
    return departmentData
}

export async function getAgeGroupData(): Promise<typeof ageGroupData> {
    return ageGroupData
}

export async function getMonthlyTrendData(): Promise<typeof monthlyTrendData> {
    return monthlyTrendData
}

export async function getTopDiagnoses(): Promise<typeof topDiagnoses> {
    return topDiagnoses
}
