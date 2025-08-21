import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET!,
    });
  }

  async validate(payload: {
    id: number;
    email: string;
    iat: number;
    exp: number;
  }) {
    if (!payload.id) {
      throw new UnauthorizedException('Unauthorized');
    }

    return { id: payload.id, email: payload.email };
  }
}
