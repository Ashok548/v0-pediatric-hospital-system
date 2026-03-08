import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { QueryServicesDto } from "./dto/query-services.dto";
export declare class ServicesService {
    create(dto: CreateServiceDto): Promise<any>;
    findAll(query: QueryServicesDto): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
        categoryCounts: any;
    }>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateServiceDto): Promise<any>;
    softDelete(id: string): Promise<any>;
}
