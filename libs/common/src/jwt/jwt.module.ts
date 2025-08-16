import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { JwtToken } from './generateToken.jwt';

@Module({
  imports: [JwtModule.register({})],
  providers: [JwtToken],
  exports: [JwtToken],
})
export class JwtTokenModule {}
