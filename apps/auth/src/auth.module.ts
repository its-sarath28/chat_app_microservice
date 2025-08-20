import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { AuthController } from './auth.controller';

import { AuthService } from './auth.service';

import { USER_CLIENT, USER_QUEUE } from '@app/common/token/token';
import { JwtTokenModule } from '@app/common/jwt/jwt.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    JwtTokenModule,
    ClientsModule.register([
      {
        name: USER_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL!],
          queue: USER_QUEUE,
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
