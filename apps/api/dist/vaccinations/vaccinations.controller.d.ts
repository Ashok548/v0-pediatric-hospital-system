import { VaccinationsService } from './vaccinations.service';
import { AdministerVaccineDto } from './dto/administer-vaccine.dto';
export declare class VaccinationsController {
    private readonly vaccinationsService;
    constructor(vaccinationsService: VaccinationsService);
    getDashboardSummary(): Promise<any>;
    findByPatient(patientId: string): Promise<any>;
    generateSchedule(patientId: string): Promise<any>;
    administerVaccine(id: string, dto: AdministerVaccineDto, req: any): Promise<any>;
}
