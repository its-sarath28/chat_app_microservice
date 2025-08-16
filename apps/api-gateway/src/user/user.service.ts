import { Inject, Injectable } from '@nestjs/common';
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
}
