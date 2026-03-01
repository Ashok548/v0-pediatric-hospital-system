import { NicuService } from "./nicu.service";
import { CreateVitalsDto } from "./dto/create-vitals.dto";
import { QueryNicuDto } from "./dto/query-nicu.dto";
export declare class NicuController {
    private nicuService;
    constructor(nicuService: NicuService);
    findNicuAdmissions(query: QueryNicuDto): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findVitals(id: string): Promise<any>;
    recordVitals(id: string, dto: CreateVitalsDto, req: any): Promise<any>;
    deleteVitals(vid: string): Promise<any>;
}
