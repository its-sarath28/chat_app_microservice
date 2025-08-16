import { Inject, Injectable } from '@nestjs/common';

import { ClientProxy } from '@nestjs/microservices';

import { PATTERN } from '@app/common/pattern/pattern';
import { AUTH_CLIENT } from '@app/common/token/token';
import { LoginDto, RegisterDto } from '@app/common/dto/auth/auth.dto';

@Injectable()
export class AuthService {
  constructor(@Inject(AUTH_CLIENT) private authClient: ClientProxy) {}

  registerUser(data: RegisterDto) {
    return this.authClient.send(PATTERN.AUTH.REGISTER, data);
  }

  loginUser(data: LoginDto) {
    return this.authClient.send(PATTERN.AUTH.LOGIN, data);
  }
}
