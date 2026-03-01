import { IsOptional, IsString, IsUUID, IsEnum, IsInt, IsPositive, Min } from "class-validator";
import { Type } from "class-transformer";

export class QueryBedsDto {
    @IsOptional()
    @IsString()
    search?: string;

    // Filter by ward directly
    @IsOptional()
    @IsUUID("4", { message: "wardId must be a valid UUID" })
    wardId?: string;

    // Cross-join: filter by floor (service resolves via ward.floorId)
    @IsOptional()
    @IsUUID("4", { message: "floorId must be a valid UUID" })
    floorId?: string;

    @IsOptional()
    @IsEnum(["AVAILABLE", "OCCUPIED", "CLEANING", "RESERVED", "MAINTENANCE"])
    status?: "AVAILABLE" | "OCCUPIED" | "CLEANING" | "RESERVED" | "MAINTENANCE";

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;
}
