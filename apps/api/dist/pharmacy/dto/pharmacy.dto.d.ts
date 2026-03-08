import { PrescriptionStatus } from '@carenest/database';
export declare class CreatePrescriptionItemDto {
    medicationId: string;
    prescribedQty: number;
}
export declare class CreatePrescriptionDto {
    patientId: string;
    admissionId?: string;
    doctorId: string;
    notes?: string;
    items: CreatePrescriptionItemDto[];
}
export declare class DispenseItemDto {
    prescriptionItemId: string;
    dispensedQty: number;
}
export declare class DispensePrescriptionDto {
    items: DispenseItemDto[];
}
export declare class GetPrescriptionsQueryDto {
    status?: PrescriptionStatus;
    search?: string;
    admissionId?: string;
}
