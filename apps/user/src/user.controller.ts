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

  @MessagePattern(PATTERN.USER.FIND_BY_ID)
  findById(@Payload() data: { userId: number }) {
    return this.userService.findById(data.userId);
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

  @MessagePattern(PATTERN.USER.TOGGLE_BLOCK)
  toggleBlock(@Payload() data: { blockerId: number; blockedId: number }) {
    return this.userService.toggleBlock(data.blockerId, data.blockerId);
  }

  @MessagePattern(PATTERN.USER.GET_BLOCK_LIST)
  getBlockedList(@Payload() data: { userId: number }) {
    return this.userService.getBlockedList(data.userId);
  }

  @MessagePattern(PATTERN.USER.GET_FRIENDS)
  getFriends(@Payload() data: { userId: number }) {
    return this.userService.getFriends(data.userId);
  }

  @MessagePattern(PATTERN.USER.SEND_REQUEST)
  sendRequest(@Payload() data: { userId: number; friendId: number }) {
    return this.userService.sendRequest(data.userId, data.friendId);
  }

  @MessagePattern(PATTERN.USER.ACCEPT_REQUEST)
  acceptRequest(@Payload() data: { userId: number; friendId: number }) {
    return this.userService.acceptRequest(data.userId, data.friendId);
  }

  @MessagePattern(PATTERN.USER.REJECT_REQUEST)
  rejectRequest(@Payload() data: { userId: number; friendId: number }) {
    return this.userService.rejectRequest(data.userId, data.friendId);
  }

  @MessagePattern(PATTERN.USER.CHECK_IS_FRIENDS)
  areFriends(@Payload() data: { userId: number; friendId: number }) {
    return this.userService.areFriends(data.userId, data.friendId);
  }

  @MessagePattern(PATTERN.USER.GET_INCOMING_REQUESTS)
  getIncomingRequests(@Payload() data: { userId: number }) {
    return this.userService.getIncomingRequests(data.userId);
  }

  @MessagePattern(PATTERN.USER.SEARCH_USERS)
  searchUsers(@Payload() data: { query: string; userId: number }) {
    return this.userService.searchUsers(data.userId, data.query);
  }

  @MessagePattern(PATTERN.USER.GET_ONLINE_USERS)
  getOnlineUsers() {
    return this.userService.getOnlineUsers();
  }

  @MessagePattern(PATTERN.USER.SUGGESTED_FRIENDS)
  getSuggestedFriends(@Payload() data: { userId: number }) {
    return this.userService.getSuggestedFriends(data.userId);
  }

  @MessagePattern(PATTERN.USER.FRIEND_PROFILE)
  getFriendProfile(@Payload() data: { userId: number; friendId: number }) {
    return this.userService.getFriendProfile(data.userId, data.friendId);
  }

  // ====================================
  // Event Patterns
  // ====================================

  @EventPattern(PATTERN.USER.UPDATE_REFRESH_TOKEN)
  updateRefreshToken(@Payload() data: RefreshTokenDto) {
    return this.userService.updateRefreshToken(data);
  }

  @EventPattern(PATTERN.USER.UPDATE_LAST_SEEN)
  updateLastSeen(@Payload() data: { userId: number }) {
    return this.userService.updateLastSeen(data.userId);
  }
}
