export declare class UpdateBedDto {
    wardId?: string;
    bedNumber?: string;
    status?: "AVAILABLE" | "OCCUPIED" | "CLEANING" | "RESERVED" | "MAINTENANCE";
    notes?: string;
}
