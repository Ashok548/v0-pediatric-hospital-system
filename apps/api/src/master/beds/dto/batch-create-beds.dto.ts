import { IsString, IsUUID, MinLength, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export class BatchCreateBedsDto {
    @IsUUID("4", { message: "wardId must be a valid UUID" })
    wardId: string;

    @IsString()
    @MinLength(1, { message: "prefix cannot be empty" })
    prefix: string;

    @Type(() => Number)
    @IsInt({ message: "startNumber must be an integer" })
    @Min(1, { message: "startNumber must be at least 1" })
    startNumber: number;

    @Type(() => Number)
    @IsInt({ message: "endNumber must be an integer" })
    @Min(1, { message: "endNumber must be at least 1" })
    endNumber: number;
}
