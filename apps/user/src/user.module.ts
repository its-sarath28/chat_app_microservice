import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { UserController } from './user.controller';

import { UserService } from './user.service';
import { User } from '../entity/user.entity';
import { Block } from '../entity/block.entity';
import { RefreshToken } from '../entity/refreshToken.entity';
import { Friendship } from '../entity/friendship.entity';

import {
  CHAT_CLIENT,
  CHAT_QUEUE,
  NOTIFICATION_CLIENT,
  NOTIFICATION_QUEUE,
  SOCKET_CLIENT,
  SOCKET_QUEUE,
} from '@app/common/token/token';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    ClientsModule.register([
      {
        name: CHAT_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL!],
          queue: CHAT_QUEUE,
          queueOptions: { durable: true },
        },
      },
      {
        name: NOTIFICATION_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL!],
          queue: NOTIFICATION_QUEUE,
          queueOptions: { durable: true },
        },
      },
      {
        name: SOCKET_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL!],
          queue: SOCKET_QUEUE,
          queueOptions: { durable: true },
        },
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, RefreshToken, Block, Friendship],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([User, RefreshToken, Block, Friendship]),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
