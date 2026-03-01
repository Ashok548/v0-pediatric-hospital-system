export declare class QueryServicesDto {
    search?: string;
    category?: "CONSULTATION" | "LAB" | "PROCEDURE" | "ROOM" | "MISC";
    status?: "ACTIVE" | "INACTIVE";
    page?: number;
    limit?: number;
}
