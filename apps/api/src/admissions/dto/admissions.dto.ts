import {
    IsString,
    IsNotEmpty,
    IsEnum,
    IsOptional,
    IsDateString,
    IsUUID,
    MaxLength,
    IsNumberString,
} from "class-validator";
import { AdmissionStatus, AdmissionType, AdmissionPriority } from "@carenest/database";

// ─── Create Admission ─────────────────────────────────────────────────────────
export class CreateAdmissionDto {
    @IsUUID()
    patientId: string;

    @IsEnum(AdmissionType)
    admissionType: AdmissionType;

    @IsOptional()
    @IsEnum(AdmissionPriority)
    priority?: AdmissionPriority;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    department: string;

    @IsOptional()
    @IsUUID()
    admittingDoctorId?: string;

    @IsDateString()
    admissionDate: string;

    @IsOptional()
    @IsDateString()
    expectedDischarge?: string;

    @IsOptional()
    @IsString()
    initialDiagnosis?: string;

    // Bed assignment (optional on DRAFT, required on ADMITTED/BED_ASSIGNED)
    @IsOptional()
    @IsUUID()
    bedId?: string;

    // NICU-specific
    @IsOptional()
    @IsString()
    @MaxLength(30)
    gestationalAge?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    nicuRiskLevel?: string;
}

// ─── Bed Transfer ─────────────────────────────────────────────────────────────
export class BedTransferDto {
    @IsUUID()
    toBedId: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    reason?: string;
}

// ─── Discharge Clearance ──────────────────────────────────────────────────────
export type ClearanceStep = "clinical" | "pharmacy" | "billing";

export class DischargeClearanceDto {
    @IsEnum(["clinical", "pharmacy", "billing"])
    step: ClearanceStep;

    @IsOptional()
    @IsString()
    note?: string; // Only applicable for clinical step
}

// ─── Finalise Discharge ───────────────────────────────────────────────────────
export class FinalizeDischargeDto {
    @IsEnum(["NORMAL", "LAMA", "REFERRED", "EXPIRED"])
    dischargeType: string;

    @IsOptional()
    @IsString()
    dischargeSummary?: string;
}

// ─── Query ────────────────────────────────────────────────────────────────────
export class QueryAdmissionsDto {
    @IsOptional()
    @IsEnum(AdmissionStatus)
    status?: AdmissionStatus;

    @IsOptional()
    @IsString()
    search?: string; // patient name, UHID, admission number

    @IsOptional()
    @IsString()
    department?: string;

    @IsOptional()
    @IsUUID()
    patientId?: string;

    @IsOptional()
    @IsNumberString()
    page?: number;

    @IsOptional()
    @IsNumberString()
    limit?: number;
}
