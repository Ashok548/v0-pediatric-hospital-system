import { AdmissionStatus, AdmissionType, AdmissionPriority } from "@carenest/database";
export declare class CreateAdmissionDto {
    patientId: string;
    admissionType: AdmissionType;
    priority?: AdmissionPriority;
    department: string;
    admittingDoctorId?: string;
    admissionDate: string;
    expectedDischarge?: string;
    initialDiagnosis?: string;
    bedId?: string;
    gestationalAge?: string;
    nicuRiskLevel?: string;
}
export declare class BedTransferDto {
    toBedId: string;
    reason?: string;
}
export type ClearanceStep = "clinical" | "pharmacy" | "billing";
export declare class DischargeClearanceDto {
    step: ClearanceStep;
    note?: string;
}
export declare class FinalizeDischargeDto {
    dischargeType: string;
    dischargeSummary?: string;
}
export declare class QueryAdmissionsDto {
    status?: AdmissionStatus;
    search?: string;
    department?: string;
    patientId?: string;
    page?: number;
    limit?: number;
}
