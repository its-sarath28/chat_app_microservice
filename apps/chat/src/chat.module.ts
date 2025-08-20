import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

import { ConversationSchema } from '../schema/conversation.schema';
import { MemberSchema } from '../schema/member.schema';
import { MessageSchema } from '../schema/message.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { USER_CLIENT, USER_QUEUE } from '@app/common/token/token';
import { ConfigModule } from '@nestjs/config';

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
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
