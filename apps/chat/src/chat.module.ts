import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ConversationSchema } from '../schema/conversation.schema';
import { MemberSchema } from '../schema/member.schema';
import { MessageSchema } from '../schema/message.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  SOCKET_CLIENT,
  SOCKET_QUEUE,
  USER_CLIENT,
  USER_QUEUE,
} from '@app/common/token/token';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '@app/redis';

import { ConversationService } from './service/conversation.service';
import { MessageService } from './service/message.service';
import { MemberService } from './service/member.service';

import { ConversationController } from './controller/conversation.controller';
import { MessageController } from './controller/message.controller';
import { MemberController } from './controller/member.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URI!),
    MongooseModule.forFeature([
      { name: 'Conversation', schema: ConversationSchema },
      { name: 'Member', schema: MemberSchema },
      { name: 'Message', schema: MessageSchema },
    ]),
    ClientsModule.register([
      {
        name: USER_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL!],
          queue: USER_QUEUE,
        },
      },
      {
        name: SOCKET_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL!],
          queue: SOCKET_QUEUE,
        },
      },
    ]),
    RedisModule,
  ],
  controllers: [ConversationController, MessageController, MemberController],
  providers: [ConversationService, MessageService, MemberService],
})
export class ChatModule {}
