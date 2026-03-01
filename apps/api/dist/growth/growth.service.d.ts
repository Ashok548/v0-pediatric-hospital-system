import { CreateGrowthRecordDto } from "./dto/create-growth-record.dto";
export declare class GrowthService {
    findByPatient(patientId: string): Promise<any>;
    create(patientId: string, dto: CreateGrowthRecordDto, recordedBy?: string): Promise<any>;
    remove(recordId: string): Promise<any>;
}
