import {
    IsString,
    MinLength,
    Matches,
    IsInt,
    IsPositive,
    IsEnum,
    IsOptional,
    IsNumber,
    Min,
} from "class-validator";

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    name?: string;

    @IsOptional()
    @Matches(/^[0-9]{10}$/, { message: "Phone must be a 10-digit number" })
    phone?: string;

    @IsOptional()
    @IsInt()
    @IsPositive()
    roleId?: number;

    @IsOptional()
    @IsEnum(["ACTIVE", "INACTIVE"], { message: "Status must be ACTIVE or INACTIVE" })
    status?: "ACTIVE" | "INACTIVE";

    @IsOptional()
    @IsNumber()
    @Min(0)
    consultationFee?: number;
}
