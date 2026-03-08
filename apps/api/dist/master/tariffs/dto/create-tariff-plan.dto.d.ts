declare class TariffRateInput {
    serviceId: string;
    priceOverride: number;
    discountPercent?: number;
}
export declare class CreateTariffPlanDto {
    code: string;
    name: string;
    description?: string;
    effectiveFrom: string;
    effectiveTo?: string;
    wardType?: string;
    rates?: TariffRateInput[];
}
export {};
