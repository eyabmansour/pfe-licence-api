import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
export class MenuDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;
}