export declare class CreateBedDto {
    wardId: string;
    bedNumber: string;
    status?: "AVAILABLE" | "OCCUPIED" | "CLEANING" | "RESERVED" | "MAINTENANCE";
}
