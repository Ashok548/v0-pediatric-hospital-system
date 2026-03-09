import { LabsService } from './labs.service';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { UpdateLabPanelResultsDto } from './dto/update-lab-results.dto';
export declare class LabsController {
    private readonly labsService;
    constructor(labsService: LabsService);
    createOrder(createLabOrderDto: CreateLabOrderDto, req: any): Promise<any>;
    findAll(): Promise<any>;
    findByPatient(patientId: string): Promise<any>;
    findOne(id: string): Promise<any>;
    updateResults(panelId: string, updateDto: UpdateLabPanelResultsDto): Promise<any>;
    finalizeOrder(id: string, req: any): Promise<any>;
    collectSample(panelId: string): Promise<any>;
    receiveSample(panelId: string): Promise<any>;
}
