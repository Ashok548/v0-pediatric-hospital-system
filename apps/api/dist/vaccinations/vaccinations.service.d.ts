import { AdministerVaccineDto } from './dto/administer-vaccine.dto';
export declare class VaccinationsService {
    getDashboardSummary(): Promise<any>;
    findByPatient(patientId: string): Promise<any>;
    generateSchedule(patientId: string): Promise<any>;
    administerVaccine(id: string, dto: AdministerVaccineDto, userId: string): Promise<any>;
}
