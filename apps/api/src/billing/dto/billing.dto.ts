import {
    IsString,
    IsNotEmpty,
    IsEnum,
    IsOptional,
    IsUUID,
    IsNumber,
    Min,
    IsNumberString,
    MaxLength,
    IsIn
} from "class-validator";
import { BillStatus, PaymentMode } from "@carenest/database";

export class CreateBillDto {
    @IsUUID()
    patientId: string;

    @IsOptional()
    @IsUUID()
    admissionId?: string;

    @IsOptional()
    @IsUUID()
    appointmentId?: string;

    @IsOptional()
    @IsUUID()
    opVisitId?: string;

    @IsOptional()
    @IsUUID()
    tariffPlanId?: string;

    @IsOptional()
    @IsString()
    doctorId?: string;

    @IsOptional()
    @IsString()
    department?: string;

    @IsOptional()
    @IsString()
    visitDate?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class AddBillItemDto {
    @IsUUID()
    serviceId: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    quantity?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    discountPercent?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    unitPrice?: number;
}

export class RecordPaymentDto {
    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsEnum(PaymentMode)
    paymentMode: PaymentMode;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    transactionRef?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    idempotencyKey?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class QueryBillsDto {
    @IsOptional()
    @IsEnum(BillStatus)
    status?: BillStatus;

    @IsOptional()
    @IsString()
    search?: string; // bill number, patient name, UHID

    @IsOptional()
    @IsUUID()
    patientId?: string;

    @IsOptional()
    @IsUUID()
    admissionId?: string;

    @IsOptional()
    @IsUUID()
    appointmentId?: string;

    @IsOptional()
    @IsNumberString()
    page?: number;

    @IsOptional()
    @IsNumberString()
    limit?: number;
}

export class BillingStatsQueryDto {
    @IsOptional()
    @IsIn(['today', 'week', 'month', 'custom'])
    period?: 'today' | 'week' | 'month' | 'custom';

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    endDate?: string;
}
