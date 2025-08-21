import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';

import { AuthModule } from '../auth/auth.module';

import { CHAT_CLIENT, CHAT_QUEUE } from '@app/common/token/token';

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
        },
      },
    ]),
    AuthModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
