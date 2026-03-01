import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";
import { QueryDepartmentsDto } from "./dto/query-departments.dto";
export declare class DepartmentsService {
    create(dto: CreateDepartmentDto): Promise<any>;
    findAll(query: QueryDepartmentsDto): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateDepartmentDto): Promise<any>;
    softDelete(id: string): Promise<any>;
    private assertUniqueDeptName;
}
