import { CreateFloorDto } from "./dto/create-floor.dto";
import { UpdateFloorDto } from "./dto/update-floor.dto";
import { QueryFloorsDto } from "./dto/query-floors.dto";
export declare class FloorsService {
    create(dto: CreateFloorDto): Promise<any>;
    findAll(query: QueryFloorsDto): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findHierarchy(): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateFloorDto): Promise<any>;
    softDelete(id: string): Promise<any>;
    private assertUniqueFloorNumber;
}
