import { CreateVitalsDto } from "./dto/create-vitals.dto";
import { QueryNicuDto } from "./dto/query-nicu.dto";
export declare class NicuService {
    findNicuAdmissions(query: QueryNicuDto): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findVitals(admissionId: string): Promise<any>;
    recordVitals(admissionId: string, dto: CreateVitalsDto, recordedBy?: string): Promise<any>;
    deleteVitals(vitalsId: string): Promise<any>;
    getCriticalAlerts(): Promise<any[]>;
    acknowledgeAlert(vitalsId: string, userId?: string): Promise<any>;
}
