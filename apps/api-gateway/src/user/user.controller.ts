import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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

  @Get('search')
  @UseGuards(AuthGuard())
  searchUsers(@Query('query') query: string, @Req() req: AuthUser) {
    return this.userService.searchUsers(req.user.id, query);
  }

  @Get('friend/all')
  @UseGuards(AuthGuard())
  getFriends(@Req() req: AuthUser) {
    return this.userService.getFriends(req.user.id);
  }

  @Get('friend/requests')
  @UseGuards(AuthGuard())
  getRequests(@Query('type') type: 'Received' | 'Send', @Req() req: AuthUser) {
    return this.userService.getRequests(type, req.user.id);
  }

  @Get('friend/online')
  @UseGuards(AuthGuard())
  getOnlineFriends() {
    return this.userService.getOnlineFriends();
  }

  @Get('friend/suggested')
  @UseGuards(AuthGuard())
  getSuggestedFriends(@Req() req: AuthUser) {
    return this.userService.getSuggestedFriends(req.user.id);
  }

  @Get('friend/profile')
  @UseGuards(AuthGuard())
  getFriendProfile(@Query('friendId') friendId: string, @Req() req: AuthUser) {
    return this.userService.getFriendProfile(req.user.id, +friendId);
  }

  @Post('friend/send-request')
  @UseGuards(AuthGuard())
  sendRequest(@Body() data: { friendId: number }, @Req() req: AuthUser) {
    return this.userService.sendRequest(req.user.id, data.friendId);
  }

  @Patch('friend/accept-request')
  @UseGuards(AuthGuard())
  acceptRequest(@Body() data: { friendId: number }, @Req() req: AuthUser) {
    return this.userService.acceptRequest(req.user.id, data.friendId);
  }

  @Patch('me')
  @UseGuards(AuthGuard())
  updateProfile(@Req() req: AuthUser, @Body() data: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.id, data);
  }

  @Patch('friend/toggle-block/:blockedId')
  @UseGuards(AuthGuard())
  toggleBlock(@Req() req: AuthUser, @Param('blockedId') blockedId: string) {
    return this.userService.toggleBlock(req.user.id, +blockedId);
  }

  @Delete('friend/reject-request')
  @UseGuards(AuthGuard())
  rejectRequest(@Body() data: { friendId: number }, @Req() req: AuthUser) {
    return this.userService.rejectRequest(req.user.id, data.friendId);
  }
}
