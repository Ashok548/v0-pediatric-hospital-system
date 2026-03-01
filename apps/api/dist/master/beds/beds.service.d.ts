import { CreateBedDto } from "./dto/create-bed.dto";
import { UpdateBedDto } from "./dto/update-bed.dto";
import { QueryBedsDto } from "./dto/query-beds.dto";
export declare class BedsService {
    create(dto: CreateBedDto): Promise<any>;
    findAll(query: QueryBedsDto): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateBedDto): Promise<any>;
    softDelete(id: string): Promise<any>;
    private assertWardExists;
    private assertUniqueBedInWard;
}
