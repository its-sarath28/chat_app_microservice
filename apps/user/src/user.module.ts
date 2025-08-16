import { Module } from '@nestjs/common';

import { UserController } from './user.controller';

import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entity/user.entity';
import { RefreshToken } from '../entity/refreshToken.entity';
import { ConfigModule } from '@nestjs/config';

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
      entities: [User, RefreshToken],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([User, RefreshToken]),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
