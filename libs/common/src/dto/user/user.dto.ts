import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  oldToken?: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  userId: number;
}
