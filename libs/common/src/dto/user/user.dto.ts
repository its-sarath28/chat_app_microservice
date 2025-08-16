import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  userId: number;
}
