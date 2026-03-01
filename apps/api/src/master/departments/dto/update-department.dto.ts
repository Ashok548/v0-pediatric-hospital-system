import { IsString, IsOptional, MinLength, IsEnum } from "class-validator";

export class UpdateDepartmentDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(["ACTIVE", "INACTIVE"])
    status?: "ACTIVE" | "INACTIVE";
}
