import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { USER_CLIENT } from '@app/common/token/token';
import { firstValueFrom } from 'rxjs';
import { PATTERN } from '@app/common/pattern/pattern';
import { UpdateProfileDto } from '@app/common/dto/user/user.dto';

@Injectable()
export class UserService {
  constructor(@Inject(USER_CLIENT) private userClient: ClientProxy) {}

  async getProfile(userId: number) {
    return await firstValueFrom(
      this.userClient.send(PATTERN.USER.GET_PROFILE, { userId }),
    );
  }

  async updateProfile(userId: number, data: UpdateProfileDto) {
    return await firstValueFrom(
      this.userClient.send(PATTERN.USER.UPDATE_PROFILE, { id: userId, data }),
    );
  }

  async toggleBlock(blockerId: number, blockedId: number) {
    if (blockedId === blockerId) {
      throw new BadRequestException('Blocker and Blocked Id cannot be same');
    }

    const user = await firstValueFrom(
      this.userClient.send(PATTERN.USER.GET_PROFILE, { userId: blockedId }),
    );

    if (!user) {
      throw new NotFoundException('User to block not found');
    }

    return await firstValueFrom(
      this.userClient.send(PATTERN.USER.TOGGLE_BLOCK, { blockerId, blockedId }),
    );
  }

  async getBlockedList(userId: number) {
    return await firstValueFrom(
      this.userClient.send(PATTERN.USER.GET_BLOCK_LIST, { userId }),
    );
  }

  async getFriends(userId: number) {
    return await firstValueFrom(
      this.userClient.send(PATTERN.USER.GET_FRIENDS, { userId }),
    );
  }

  async sendRequest(userId: number, friendId: number) {
    if (userId === friendId) {
      throw new BadRequestException('User ID and Friend ID cannot be the same');
    }

    const areFriends = await firstValueFrom(
      this.userClient.send(PATTERN.USER.CHECK_IS_FRIENDS, { userId, friendId }),
    );

    if (areFriends) return { success: true, message: 'Already friends' };

    return await firstValueFrom(
      this.userClient.send(PATTERN.USER.SEND_REQUEST, { userId, friendId }),
    );
  }

  async acceptRequest(userId: number, friendId: number) {
    if (userId === friendId) {
      throw new BadRequestException('User ID and Friend ID cannot be the same');
    }

    const areFriends = await firstValueFrom(
      this.userClient.send(PATTERN.USER.CHECK_IS_FRIENDS, { userId, friendId }),
    );

    if (areFriends) return { success: true, message: 'Already friends' };

    return await firstValueFrom(
      this.userClient.send(PATTERN.USER.ACCEPT_REQUEST, { userId, friendId }),
    );
  }

  async rejectRequest(userId: number, friendId: number) {
    return await firstValueFrom(
      this.userClient.send(PATTERN.USER.REJECT_REQUEST, { userId, friendId }),
    );
  }

  async getIncomingRequests(userId: number) {
    return await firstValueFrom(
      this.userClient.send(PATTERN.USER.GET_INCOMING_REQUESTS, { userId }),
    );
  }

  async searchUsers(query: string) {
    if (query.trim() === '') return [];

    return await firstValueFrom(
      this.userClient.send(PATTERN.USER.SEARCH_USERS, { query }),
    );
  }
}
