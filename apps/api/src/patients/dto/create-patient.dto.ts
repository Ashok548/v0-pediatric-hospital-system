import {
    IsString,
    IsNotEmpty,
    IsEnum,
    IsDateString,
    IsOptional,
    MaxLength,
    Matches,
    IsEmail,
    IsNumberString,
    IsDecimal,
    IsNumber,
    Min,
    Max,
} from "class-validator";
import { Type } from "class-transformer";
import { Gender } from "@carenest/database";

export class CreatePatientDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    firstName: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    lastName: string;

    @IsEnum(Gender)
    gender: Gender;

    @IsDateString()
    dateOfBirth: string;

    @IsOptional()
    @IsString()
    @MaxLength(5)
    bloodGroup?: string;

    @IsOptional()
    @IsString()
    @Matches(/^[0-9]{2}-[0-9]{4}-[0-9]{4}-[0-9]{4}$/, { message: "ABHA ID must be in format XX-XXXX-XXXX-XXXX" })
    abhaId?: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^\+?\d{10,15}$/, { message: "Phone must be 10-15 digits, optionally starting with +" })
    phone: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    guardianName: string;

    @IsOptional()
    @IsString()
    @Matches(/^\+?\d{10,15}$/, { message: "Guardian phone must be 10-15 digits, optionally starting with +" })
    guardianPhone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(30)
    guardianRelationship?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0.1, { message: "Birth weight must be at least 0.1 kg" })
    @Max(20, { message: "Birth weight cannot exceed 20 kg" })
    birthWeight?: number;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    city?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    state?: string;

    @IsOptional()
    @IsString()
    @Matches(/^\d{6}$/, { message: "Pincode must be exactly 6 digits" })
    pincode?: string;
}

