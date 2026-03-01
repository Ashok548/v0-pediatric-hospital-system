export declare class QueryBedsDto {
    search?: string;
    wardId?: string;
    floorId?: string;
    status?: "AVAILABLE" | "OCCUPIED" | "CLEANING" | "RESERVED" | "MAINTENANCE";
    page?: number;
    limit?: number;
}
