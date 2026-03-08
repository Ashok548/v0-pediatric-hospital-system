import { PrescriptionStatus } from '@carenest/database';
import { CreatePrescriptionDto, DispensePrescriptionDto } from './dto/pharmacy.dto';
export declare class PharmacyService {
    private readonly prisma;
    constructor();
    getInventory(): Promise<any>;
    getPrescriptions(query: {
        status?: PrescriptionStatus;
        search?: string;
        admissionId?: string;
    }): Promise<any>;
    getPrescription(id: string): Promise<any>;
    createPrescription(dto: CreatePrescriptionDto): Promise<any>;
    dispensePrescription(id: string, dto: DispensePrescriptionDto, dispensedBy: string): Promise<any>;
    returnPrescription(id: string, returnedBy: string): Promise<any>;
    getStats(): Promise<{
        totalActive: any;
        pending: any;
        partial: any;
        dispensedToday: any;
        lowStockCount: any;
        urgentCount: any;
    }>;
    checkClearance(admissionId: string): Promise<{
        cleared: boolean;
        pendingPrescriptions: any;
    }>;
}
