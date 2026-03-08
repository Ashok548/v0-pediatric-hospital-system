import { PharmacyService } from './pharmacy.service';
import { CreatePrescriptionDto, DispensePrescriptionDto, GetPrescriptionsQueryDto } from './dto/pharmacy.dto';
export declare class PharmacyController {
    private readonly pharmacyService;
    constructor(pharmacyService: PharmacyService);
    getInventory(): Promise<{
        data: any;
    }>;
    getPrescriptions(query: GetPrescriptionsQueryDto): Promise<{
        data: any;
    }>;
    getPrescription(id: string): Promise<{
        data: any;
    }>;
    createPrescription(dto: CreatePrescriptionDto): Promise<{
        data: any;
    }>;
    dispensePrescription(id: string, dto: DispensePrescriptionDto, req: any): Promise<{
        data: any;
    }>;
    returnPrescription(id: string, req: any): Promise<{
        data: any;
    }>;
    getStats(): Promise<{
        data: {
            totalActive: any;
            pending: any;
            partial: any;
            dispensedToday: any;
            lowStockCount: any;
            urgentCount: any;
        };
    }>;
    checkClearance(admissionId: string): Promise<{
        data: {
            cleared: boolean;
            pendingPrescriptions: any;
        };
    }>;
}
