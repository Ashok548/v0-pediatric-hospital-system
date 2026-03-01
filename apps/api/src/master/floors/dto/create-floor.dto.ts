import { IsString, MinLength, IsInt, Min, IsOptional, IsEnum } from "class-validator";
import { Type } from "class-transformer";

export class CreateFloorDto {
    @IsString()
    @MinLength(2, { message: "Name must be at least 2 characters" })
    name: string;

    @Type(() => Number)
    @IsInt({ message: "floor_number must be an integer" })
    @Min(0, { message: "floor_number must be 0 or greater" })
    floorNumber: number;

    @IsOptional()
    @IsEnum(["ACTIVE", "INACTIVE"])
    status?: "ACTIVE" | "INACTIVE" = "ACTIVE";
}
