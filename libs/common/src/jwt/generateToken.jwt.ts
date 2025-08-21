import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtToken {
  constructor(private jwtService: JwtService) {}

  async generateAccessToken(id: number, email: string) {
    const payload = { id, email };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '2h',
    });

    return accessToken;
  }

  async generateRefreshToken(id: number, email: string) {
    const payload = { id, email };
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '30d',
    });

    return refreshToken;
  }

  verifyRefreshToken(token: string) {
    return this.jwtService.verify(token, {
      secret: process.env.JWT_REFRESH_SECRET,
    });
  }

  decodeRefreshToken(token: string) {
    return this.jwtService.decode(token) as { id: number; email: string };
  }
}
