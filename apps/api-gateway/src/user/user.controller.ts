import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { UserService } from './user.service';

import { UpdateProfileDto } from '@app/common/dto/user/user.dto';
import { AuthUser } from '@app/common/dto/auth/auth.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(AuthGuard())
  getProfile(@Req() req: AuthUser) {
    return this.userService.getProfile(req.user.id);
  }

  @Get('block-list')
  @UseGuards(AuthGuard())
  getBlockedList(@Req() req: AuthUser) {
    return this.userService.getBlockedList(req.user.id);
  }

  @Patch('me')
  @UseGuards(AuthGuard())
  updateProfile(@Req() req: AuthUser, @Body() data: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.id, data);
  }

  @Patch('toggle-block/:blockedId')
  @UseGuards(AuthGuard())
  toggleBlock(@Req() req: AuthUser, @Param('blockedId') blockedId: string) {
    return this.userService.toggleBlock(req.user.id, +blockedId);
  }
}
