import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
export declare class ConsultationsService {
    create(dto: CreateConsultationDto, doctorId: string): Promise<any>;
    findByPatient(patientId: string): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateConsultationDto, doctorId: string): Promise<any>;
}
