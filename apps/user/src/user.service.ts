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

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const user: User | null = await this.userRepo.findOneBy({ email });

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
}
