export const LAB_ORDER_TERMINAL_STATUSES = ["VERIFIED", "CANCELLED"] as const

export type LabOrderStatus =
  | "DRAFT"
  | "PENDING_CLEARANCE"
  | "AWAITING_SAMPLE"
  | "SAMPLE_COLLECTED"
  | "PROCESSING"
  | "PARTIAL"
  | "RESULT_ENTERED"
  | "VERIFIED"
  | "CANCELLED"

export type LabOrderDashboardBucket = "AWAITING_SAMPLE" | "IN_PROGRESS" | "VERIFIED" | "ALL"

export function isTerminalLabOrderStatus(status?: string | null): boolean {
  return status === "VERIFIED" || status === "CANCELLED"
}

export function getLabOrderDashboardBucket(status?: string | null): LabOrderDashboardBucket {
  switch (status) {
    case "DRAFT":
    case "PENDING_CLEARANCE":
    case "AWAITING_SAMPLE":
      return "AWAITING_SAMPLE"
    case "SAMPLE_COLLECTED":
    case "PROCESSING":
    case "PARTIAL":
    case "RESULT_ENTERED":
      return "IN_PROGRESS"
    case "VERIFIED":
      return "VERIFIED"
    default:
      return "ALL"
  }
}

export function getLabOrderStatusLabel(status?: string | null): string {
  switch (status) {
    case "DRAFT":
      return "Draft"
    case "PENDING_CLEARANCE":
      return "Pending Clearance"
    case "AWAITING_SAMPLE":
      return "Awaiting Sample"
    case "SAMPLE_COLLECTED":
      return "Sample Collected"
    case "PROCESSING":
      return "Processing"
    case "PARTIAL":
      return "Partial Results"
    case "RESULT_ENTERED":
      return "Result Entered"
    case "VERIFIED":
      return "Verified"
    case "CANCELLED":
      return "Cancelled"
    default:
      return status || "Unknown"
  }
}