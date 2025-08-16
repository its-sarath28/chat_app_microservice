import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

import { UserService } from './user.service';

import { PATTERN } from '@app/common/pattern/pattern';
import { RefreshTokenDto } from '@app/common/dto/user/user.dto';
import { RegisterDto } from '@app/common/dto/auth/auth.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ====================================
  // Message Patterns
  // ====================================

  @MessagePattern(PATTERN.USER.FIND_BY_EMAIL)
  findByEmail(@Payload() data: { email: string }) {
    return this.userService.findByEmail(data.email);
  }

  @MessagePattern(PATTERN.USER.CREATE_USER)
  createUser(@Payload() data: RegisterDto) {
    return this.userService.createUser(data);
  }

  @MessagePattern(PATTERN.USER.GET_REFRESH_TOKEN)
  getRefreshTokens(@Payload() data: { userId: number; token: string }) {
    return this.userService.getRefreshTokens(data);
  }

  @MessagePattern(PATTERN.USER.GET_PROFILE)
  getProfile(@Payload() data: { userId: number }) {
    return this.userService.getProfile(data.userId);
  }

  // ====================================
  // Event Patterns
  // ====================================

  @EventPattern(PATTERN.USER.UPDATE_REFRESH_TOKEN)
  updateRefreshToken(@Payload() data: RefreshTokenDto) {
    return this.userService.updateRefreshToken(data);
  }
}
