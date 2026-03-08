import { IsString, IsNumber, IsOptional, Min, Max } from "class-validator";

export class UpsertTariffRateDto {
    @IsString()
    serviceId: string;

    @IsNumber()
    @Min(0)
    priceOverride: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    discountPercent?: number;
}
