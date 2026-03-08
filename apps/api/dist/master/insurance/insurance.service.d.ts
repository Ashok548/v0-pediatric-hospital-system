import { CreateInsuranceDto } from "./dto/create-insurance.dto";
import { UpdateInsuranceDto } from "./dto/update-insurance.dto";
import { QueryInsuranceDto } from "./dto/query-insurance.dto";
export declare class InsuranceService {
    create(dto: CreateInsuranceDto): Promise<any>;
    findAll(query: QueryInsuranceDto): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateInsuranceDto): Promise<any>;
    toggleStatus(id: string): Promise<any>;
}
