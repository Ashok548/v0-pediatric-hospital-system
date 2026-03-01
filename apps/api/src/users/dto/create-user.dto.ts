import {
    IsEmail,
    IsString,
    MinLength,
    Matches,
    IsInt,
    IsPositive,
} from "class-validator";

export class CreateUserDto {
    @IsString()
    @MinLength(2, { message: "Name must be at least 2 characters" })
    name: string;

    @IsEmail({}, { message: "Please provide a valid email address" })
    email: string;

    @Matches(/^[0-9]{10}$/, { message: "Phone must be a 10-digit number" })
    phone: string;

    @IsInt()
    @IsPositive()
    roleId: number;

    @IsString()
    @MinLength(8, { message: "Password must be at least 8 characters" })
    password: string;

    @IsString()
    @MinLength(8)
    confirmPassword: string;
}
