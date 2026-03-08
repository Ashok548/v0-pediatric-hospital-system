export declare class UpdateServiceDto {
    code?: string;
    name?: string;
    category?: "CONSULTATION" | "LAB" | "PROCEDURE" | "ROOM" | "MISC";
    basePrice?: number;
    taxPercent?: number;
    status?: "ACTIVE" | "INACTIVE";
}
