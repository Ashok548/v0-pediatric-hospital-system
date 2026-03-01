import { WardsService } from "./wards.service";
import { CreateWardDto } from "./dto/create-ward.dto";
import { UpdateWardDto } from "./dto/update-ward.dto";
import { QueryWardsDto } from "./dto/query-wards.dto";
export declare class WardsController {
    private wardsService;
    constructor(wardsService: WardsService);
    create(dto: CreateWardDto): Promise<any>;
    findAll(query: QueryWardsDto): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateWardDto): Promise<any>;
    softDelete(id: string): Promise<any>;
}
