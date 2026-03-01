import { GrowthService } from "./growth.service";
import { CreateGrowthRecordDto } from "./dto/create-growth-record.dto";
export declare class GrowthController {
    private growthService;
    constructor(growthService: GrowthService);
    findByPatient(patientId: string): Promise<any>;
    create(patientId: string, dto: CreateGrowthRecordDto, req: any): Promise<any>;
    remove(recordId: string): Promise<any>;
}
