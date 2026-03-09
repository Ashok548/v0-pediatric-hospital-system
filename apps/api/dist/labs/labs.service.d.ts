import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { UpdateLabPanelResultsDto } from './dto/update-lab-results.dto';
export declare class LabsService {
    private generateOrderNumber;
    createOrder(dto: CreateLabOrderDto, doctorId: string): Promise<any>;
    findByPatient(patientId: string): Promise<any>;
    findAll(): Promise<any>;
    findOne(id: string): Promise<any>;
    updatePanelResults(panelId: string, dto: UpdateLabPanelResultsDto): Promise<any>;
    finalizeOrder(id: string, userId: string): Promise<any>;
    collectSample(panelId: string): Promise<any>;
    receiveSample(panelId: string): Promise<any>;
}
