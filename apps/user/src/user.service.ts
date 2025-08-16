import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../entity/user.entity';
import { RefreshToken } from '../entity/refreshToken.entity';

import { RegisterDto } from '@app/common/dto/auth/auth.dto';
import { RefreshTokenDto } from '@app/common/dto/user/user.dto';

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
}
