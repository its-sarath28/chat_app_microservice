import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';

import { AuthService } from './auth.service';

import { LoginDto, RegisterDto } from '@app/common/dto/auth/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  registerUser(@Body() registerDto: RegisterDto) {
    return this.authService.registerUser(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  loginUser(@Body() loginDto: LoginDto) {
    return this.authService.loginUser(loginDto);
  }
}
