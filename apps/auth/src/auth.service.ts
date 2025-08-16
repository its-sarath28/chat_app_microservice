import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import * as bcrypt from 'bcrypt';
import { TokenExpiredError } from '@nestjs/jwt';

import { User } from 'apps/user/entity/user.entity';

import { LoginDto, RegisterDto } from '@app/common/dto/auth/auth.dto';
import { JwtToken } from '@app/common/jwt/generateToken.jwt';
import { PATTERN } from '@app/common/pattern/pattern';
import { USER_CLIENT } from '@app/common/token/token';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_CLIENT) private userClient: ClientProxy,
    private readonly jwtToken: JwtToken,
  ) {}

  async registerUser(data: RegisterDto) {
    const existingUser: User | null = await firstValueFrom(
      this.userClient.send<User | null>(PATTERN.USER.FIND_BY_EMAIL, {
        email: data.email,
      }),
    );

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user: User = await firstValueFrom(
      this.userClient.send(PATTERN.USER.CREATE_USER, data),
    );

    const accessToken: string = await this.jwtToken.generateAccessToken(
      user.id,
      user.email,
    );
    const refreshToken: string = await this.jwtToken.generateRefreshToken(
      user.id,
      user.email,
    );

    this.userClient.emit(PATTERN.USER.UPDATE_REFRESH_TOKEN, {
      userId: user.id,
      token: refreshToken,
    });

    return { accessToken, refreshToken };
  }

  async loginUser(data: LoginDto) {
    const user: User | null = await firstValueFrom(
      this.userClient.send<User | null>(PATTERN.USER.FIND_BY_EMAIL, {
        email: data.email,
      }),
    );

    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      throw new BadRequestException('Invalid credentials');
    }

    const accessToken: string = await this.jwtToken.generateAccessToken(
      user.id,
      user.email,
    );
    const refreshToken: string = await this.jwtToken.generateRefreshToken(
      user.id,
      user.email,
    );

    this.userClient.emit(PATTERN.USER.UPDATE_REFRESH_TOKEN, {
      userId: user.id,
      token: refreshToken,
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtToken.verifyRefreshToken(token);

      const userId = payload.userId;

      const savedToken = await firstValueFrom(
        this.userClient.send(PATTERN.USER.GET_REFRESH_TOKEN, {
          userId,
          token,
        }),
      );

      if (!savedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const accessToken = await this.jwtToken.generateAccessToken(
        payload.userId,
        payload.email,
      );

      return { accessToken };
    } catch (err) {
      if (
        err instanceof TokenExpiredError ||
        err.name === 'TokenExpiredError'
      ) {
        const payload = this.jwtToken.decodeRefreshToken(token);

        const newAccessToken = await this.jwtToken.generateAccessToken(
          payload.userId,
          payload.email,
        );
        const newRefreshToken = await this.jwtToken.generateRefreshToken(
          payload.userId,
          payload.email,
        );

        this.userClient.emit(PATTERN.USER.UPDATE_REFRESH_TOKEN, {
          userId: payload.userId,
          token: newRefreshToken,
          oldToken: token,
        });

        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
      }

      throw new UnauthorizedException('Invalid token');
    }
  }
}
