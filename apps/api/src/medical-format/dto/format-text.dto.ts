import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class FormatTextDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text!: string;
}
