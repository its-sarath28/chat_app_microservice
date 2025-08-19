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

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(AuthGuard())
  getProfile(@Req() req: any) {
    return this.userService.getProfile(req.user.userId);
  }

  @Get('block-list')
  @UseGuards(AuthGuard())
  getBlockedList(@Req() req: any) {
    return this.userService.getBlockedList(req.user.userId);
  }

  @Patch('me')
  @UseGuards(AuthGuard())
  updateProfile(@Req() req: any, @Body() data: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.userId, data);
  }

  @Patch('toggle-block/:blockedId')
  @UseGuards(AuthGuard())
  toggleBlock(@Req() req: any, @Param('blockedId') blockedId: string) {
    return this.userService.toggleBlock(req.user.userId, +blockedId);
  }
}
