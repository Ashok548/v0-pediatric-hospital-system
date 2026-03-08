export declare class UpdateInsuranceDto {
    code?: string;
    name?: string;
    contactEmail?: string;
    contactPhone?: string;
    claimPrefix?: string;
    discountPercent?: number;
    maxCoverLimit?: number;
    notes?: string;
    status?: "ACTIVE" | "INACTIVE";
}
