import { PatientsService } from "./patients.service";
import { CreatePatientDto } from "./dto/create-patient.dto";
import { UpdatePatientDto } from "./dto/update-patient.dto";
import { QueryPatientsDto } from "./dto/query-patients.dto";
import { AdmissionsService } from "../admissions/admissions.service";
export declare class PatientsController {
    private readonly patientsService;
    private readonly admissionsService;
    constructor(patientsService: PatientsService, admissionsService: AdmissionsService);
    create(createPatientDto: CreatePatientDto): Promise<any>;
    findAll(query: QueryPatientsDto): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<any>;
    update(id: string, updatePatientDto: UpdatePatientDto): Promise<any>;
    softDelete(id: string): Promise<any>;
    getAdmissions(id: string): Promise<any>;
}
