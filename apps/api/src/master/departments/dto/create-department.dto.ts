import { IsString, IsOptional, MinLength, IsEnum } from "class-validator";

export class CreateDepartmentDto {
    @IsString()
    @MinLength(2, { message: "Name must be at least 2 characters" })
    name: string;

    @IsOptional()
    @IsString()
    description?: string = "";

    @IsOptional()
    @IsEnum(["ACTIVE", "INACTIVE"])
    status?: "ACTIVE" | "INACTIVE" = "ACTIVE";
}
