import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
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

  @Patch('me')
  @UseGuards(AuthGuard())
  updateProfile(@Req() req: any, @Body() data: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.userId, data);
  }
}
