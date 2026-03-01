import type { Request } from "express";
import { AdmissionsService } from "./admissions.service";
import { CreateAdmissionDto, BedTransferDto, DischargeClearanceDto, FinalizeDischargeDto, QueryAdmissionsDto } from "./dto/admissions.dto";
export declare class AdmissionsController {
    private readonly service;
    constructor(service: AdmissionsService);
    create(dto: CreateAdmissionDto, req: Request): Promise<any>;
    findAll(query: QueryAdmissionsDto): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<any>;
    transferBed(id: string, dto: BedTransferDto, req: Request): Promise<any>;
    updateClearance(id: string, dto: DischargeClearanceDto, req: Request): Promise<any>;
    finalizeDischarge(id: string, dto: FinalizeDischargeDto, req: Request): Promise<any>;
    cancel(id: string): Promise<any>;
}
