export declare class UpdateWardDto {
    floorId?: string;
    name?: string;
    type?: "GENERAL" | "PRIVATE" | "NICU" | "PICU";
    totalBeds?: number;
    status?: "ACTIVE" | "INACTIVE";
}
