import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../entity/user.entity';
import { RefreshToken } from '../entity/refreshToken.entity';

import { RegisterDto } from '@app/common/dto/auth/auth.dto';
import {
  RefreshTokenDto,
  UpdateProfileDto,
} from '@app/common/dto/user/user.dto';
import { Block } from '../entity/block.entity';
import { Friendship } from '../entity/friendship.entity';
import { FRIENDSHIP_STATUS } from '../enum/user.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Block) private blockRepo: Repository<Block>,
    @InjectRepository(Friendship)
    private friendshipRepo: Repository<Friendship>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const user: User | null = await this.userRepo.findOne({
      where: { email },
      select: ['id', 'email', 'password'],
    });

    return user;
  }

  async createUser(data: RegisterDto): Promise<User> {
    const { email, password, username, fullName } = data;

    const hashedPassword: string = await bcrypt.hash(password, 10);

    const user: User = this.userRepo.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      username: username.toLocaleLowerCase(),
    });

    return await this.userRepo.save(user);
  }

  async updateRefreshToken(data: RefreshTokenDto) {
    if (data.oldToken) {
      const existingToken: RefreshToken | null =
        await this.refreshTokenRepo.findOne({
          where: { token: data.oldToken, user: { id: data.userId } },
        });

      if (existingToken) {
        existingToken.token = data.token;
        await this.refreshTokenRepo.save(existingToken);
      }
    }

    const tokens: RefreshToken[] = await this.refreshTokenRepo.find({
      where: { user: { id: data.userId } },
      order: { id: 'ASC' },
    });

    if (tokens.length > 5) {
      const oldest = tokens[0];
      await this.refreshTokenRepo.remove(oldest);
    }

    const newToken = this.refreshTokenRepo.create({
      token: data.token,
      user: { id: data.userId },
    });

    await this.refreshTokenRepo.save(newToken);
  }

  async getRefreshTokens(data: { userId: number; token: string }) {
    const token: RefreshToken | null = await this.refreshTokenRepo.findOne({
      where: { user: { id: data.userId }, token: data.token },
    });

    return token;
  }

  async getProfile(id: number): Promise<User> {
    const user: User | null = await this.userRepo.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(
    id: number,
    updateData: UpdateProfileDto,
    file?: Express.Multer.File,
  ) {
    const user: User | null = await this.userRepo.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // TODO: Upload avatar file

    await this.userRepo.update(id, { ...updateData });

    return {
      success: true,
      data: (await this.userRepo.findOne({ where: { id } }))!,
    };
  }

  async toggleBlock(blockerId: number, blockedId: number) {
    const alreadyBlocked: Block | null = await this.blockRepo.findOne({
      where: {
        blockerId: { id: blockerId },
        blockedId: { id: blockedId },
      },
    });

    if (alreadyBlocked) {
      await this.blockRepo.delete(alreadyBlocked);

      return { success: true, message: 'Unblocked user' };
    }

    const newBlock = this.blockRepo.create({
      blockedId: { id: blockedId },
      blockerId: { id: blockerId },
      blockedOn: new Date(),
    });

    await this.blockRepo.save(newBlock);

    return { success: true, message: 'Blocked user' };
  }

  async getBlockedList(userId: number) {
    const list: Block[] = await this.blockRepo.find({
      where: { blockerId: { id: userId } },
      relations: ['blocked'],
    });

    const formattedResponse = list.map((block: Block) => ({
      id: block.blockedId.id,
      fullName: block.blockedId.fullName,
      imageUrl: block.blockedId.imageUrl ?? null,
    }));

    return formattedResponse;
  }

  async sendRequest(userId: number, friendId: number) {
    const [user, friend]: [User, User] = await Promise.all([
      this.getProfile(userId),
      this.getProfile(friendId),
    ]);

    const friendship = this.friendshipRepo.create({
      user,
      friend,
      status: FRIENDSHIP_STATUS.PENDING,
    });

    await this.friendshipRepo.save(friendship);

    return {
      success: true,
      message: `Request send successfully to ${friend.username}`,
    };
  }

  async acceptRequest(userId: number, friendId: number) {
    const friendship: Friendship | null = await this.friendshipRepo.findOne({
      where: [
        { user: { id: userId }, friend: { id: friendId } },
        { user: { id: friendId }, friend: { id: userId } },
      ],
      relations: ['user', 'friend'],
    });

    if (!friendship) throw new NotFoundException('Request not found');

    friendship.status = FRIENDSHIP_STATUS.ACCEPTED;

    await this.friendshipRepo.save(friendship);

    return {
      success: true,
      message: `Accepted request from ${friendship.friend.username}`,
    };
  }

  async rejectRequest(userId: number, friendId: number) {
    const friendship: Friendship | null = await this.friendshipRepo.findOne({
      where: {
        user: { id: userId },
        friend: { id: friendId },
      },
    });

    if (!friendship) throw new NotFoundException('Request not found');

    await this.friendshipRepo.remove(friendship);

    return {
      success: true,
      message: `Rejected request from ${friendship.friend.username}`,
    };
  }

  async areFriends(userId: number, friendId: number) {
    const friendship = await this.friendshipRepo.findOne({
      where: [
        {
          user: { id: userId },
          friend: { id: friendId },
          status: FRIENDSHIP_STATUS.ACCEPTED,
        },
        {
          user: { id: friendId },
          friend: { id: userId },
          status: FRIENDSHIP_STATUS.ACCEPTED,
        },
      ],
    });
    return !!friendship;
  }

  async getFriends(userId: number) {
    const friendships = await this.friendshipRepo.find({
      where: [
        { user: { id: userId }, status: FRIENDSHIP_STATUS.ACCEPTED },
        { friend: { id: userId }, status: FRIENDSHIP_STATUS.ACCEPTED },
      ],
      relations: ['user', 'friend'],
    });

    return friendships?.map((fs: Friendship) => {
      const friend: User = fs.user.id === userId ? fs.friend : fs.user;

      return {
        id: friend.id,
        fullName: friend.fullName,
        username: friend.username,
        imageUrl: friend.imageUrl ?? null,
      };
    });
  }

  async getIncomingRequests(userId: number) {
    const requests = await this.friendshipRepo.find({
      where: {
        friend: { id: userId },
        status: FRIENDSHIP_STATUS.PENDING,
      },
      relations: ['user'],
    });

    return requests.map((req) => ({
      id: req.user.id,
      fullName: req.user.fullName,
      username: req.user.username,
      imageUrl: req.user.imageUrl,
    }));
  }
}
