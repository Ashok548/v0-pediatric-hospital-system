import { CreateAdmissionDto, BedTransferDto, DischargeClearanceDto, FinalizeDischargeDto, QueryAdmissionsDto } from "./dto/admissions.dto";
export declare class AdmissionsService {
    private generateAdmissionNumber;
    create(dto: CreateAdmissionDto, requestingUserId?: string): Promise<any>;
    private createWithBed;
    findAll(query: QueryAdmissionsDto): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<any>;
    findByPatient(patientId: string): Promise<any>;
    transferBed(id: string, dto: BedTransferDto, requestingUserId?: string): Promise<any>;
    updateDischargeClearance(id: string, dto: DischargeClearanceDto, requestingUserId?: string): Promise<any>;
    finalizeDischarge(id: string, dto: FinalizeDischargeDto, requestingUserId?: string): Promise<any>;
    cancel(id: string): Promise<any>;
}
