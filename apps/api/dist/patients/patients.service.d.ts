import { CreatePatientDto } from "./dto/create-patient.dto";
import { UpdatePatientDto } from "./dto/update-patient.dto";
import { QueryPatientsDto } from "./dto/query-patients.dto";
export declare class PatientsService {
    private generateUhid;
    create(dto: CreatePatientDto): Promise<any>;
    findAll(query: QueryPatientsDto): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdatePatientDto): Promise<any>;
    softDelete(id: string): Promise<any>;
}
