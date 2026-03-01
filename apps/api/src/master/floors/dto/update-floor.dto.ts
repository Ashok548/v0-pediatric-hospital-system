import { IsString, IsInt, IsEnum, IsOptional, MinLength, Min } from "class-validator";
import { Type } from "class-transformer";

export class UpdateFloorDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    name?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    floorNumber?: number;

    @IsOptional()
    @IsEnum(["ACTIVE", "INACTIVE"])
    status?: "ACTIVE" | "INACTIVE";
}
