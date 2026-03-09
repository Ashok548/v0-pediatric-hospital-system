import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
export declare class ConsultationsController {
    private readonly consultationsService;
    constructor(consultationsService: ConsultationsService);
    create(createConsultationDto: CreateConsultationDto, req: any): Promise<any>;
    findByPatient(patientId: string): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, updateConsultationDto: UpdateConsultationDto, req: any): Promise<any>;
}
