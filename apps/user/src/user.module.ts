import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { UserController } from './user.controller';

import { UserService } from './user.service';
import { User } from '../entity/user.entity';
import { Block } from '../entity/block.entity';
import { RefreshToken } from '../entity/refreshToken.entity';
import { Friendship } from '../entity/friendship.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
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
