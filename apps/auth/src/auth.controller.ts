import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { AuthService } from './auth.service';

import { PATTERN } from '@app/common/pattern/pattern';

import { LoginDto, RegisterDto } from '@app/common/dto/auth/auth.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(PATTERN.AUTH.REGISTER)
  registerUser(@Payload() registerDto: RegisterDto) {
    return this.authService.registerUser(registerDto);
  }

  @MessagePattern(PATTERN.AUTH.LOGIN)
  loginUser(@Payload() loginDto: LoginDto) {
    return this.authService.loginUser(loginDto);
  }

  @MessagePattern(PATTERN.AUTH.REFRESH_TOKEN)
  refreshToken(@Payload() token: string) {
    return this.authService.refreshToken(token);
  }
}
