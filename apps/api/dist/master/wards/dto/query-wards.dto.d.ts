export declare class QueryWardsDto {
    search?: string;
    floorId?: string;
    type?: "GENERAL" | "PRIVATE" | "NICU" | "PICU";
    status?: "ACTIVE" | "INACTIVE";
    page?: number;
    limit?: number;
}
