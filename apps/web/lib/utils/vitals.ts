// ─────────────────────────────────────────────────────────────────────────────
// lib/utils/vitals.ts
// Shared NICU vitals abnormality range logic.
// Extracted from nicu-baby-card.tsx so it can be reused by API-backed components.
// ─────────────────────────────────────────────────────────────────────────────

export type VitalLevel = "normal" | "warning" | "critical"
export type NicuStatus = "stable" | "warning" | "critical"

/** Determine vitals alarm level for a specific reading */
export function getVitalLevel(
    type: "heartRate" | "spo2" | "temperature" | "respiratoryRate",
    value: number
): VitalLevel {
    switch (type) {
        case "heartRate":
            if (value < 100 || value > 180) return "critical"
            if (value < 110 || value > 170) return "warning"
            return "normal"
        case "spo2":
            if (value < 88) return "critical"
            if (value < 92) return "warning"
            return "normal"
        case "temperature":
            if (value < 36.0 || value > 38.0) return "critical"
            if (value < 36.3 || value > 37.5) return "warning"
            return "normal"
        case "respiratoryRate":
            if (value < 30 || value > 80) return "critical"
            if (value < 35 || value > 60) return "warning"
            return "normal"
    }
}

/**
 * Derive an overall clinical status from a set of latest vitals.
 * Falls back to `nicuRiskLevel` string if no vitals are available.
 */
export function deriveNicuStatus(vitals: {
    heartRate?: number | null
    spo2?: number | null
    temperature?: number | null
    respiratoryRate?: number | null
} | null, nicuRiskLevel?: string | null): NicuStatus {

    // If we have actual vitals, compute from them
    if (vitals) {
        const levels: VitalLevel[] = []
        if (vitals.heartRate != null) levels.push(getVitalLevel("heartRate", vitals.heartRate))
        if (vitals.spo2 != null) levels.push(getVitalLevel("spo2", vitals.spo2))
        if (vitals.temperature != null) levels.push(getVitalLevel("temperature", Number(vitals.temperature)))
        if (vitals.respiratoryRate != null) levels.push(getVitalLevel("respiratoryRate", vitals.respiratoryRate))

        if (levels.includes("critical")) return "critical"
        if (levels.includes("warning")) return "warning"
        if (levels.length > 0) return "stable"
    }

    // Fall back to admission-level risk label
    if (!nicuRiskLevel) return "stable"
    const normalized = nicuRiskLevel.toUpperCase()
    if (normalized === "HIGH" || normalized === "CRITICAL") return "critical"
    if (normalized === "MODERATE" || normalized === "MEDIUM") return "warning"
    return "stable"
}
