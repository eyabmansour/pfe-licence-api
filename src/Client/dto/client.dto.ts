import { IsOptional, IsString } from 'class-validator';

export class RestaurantQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  menu?: boolean;

  @IsOptional()
  menuItem?: boolean;
}
