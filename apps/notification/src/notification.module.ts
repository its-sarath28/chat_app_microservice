import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

import { NotificationSchema } from '../schema/notification.schema';

import { SocketGatewayModule } from 'apps/socket-gateway/src/socket-gateway.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SOCKET_CLIENT, SOCKET_QUEUE } from '@app/common/token/token';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    ClientsModule.register([
      {
        name: SOCKET_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL!],
          queue: SOCKET_QUEUE,
        },
      },
    ]),
    MongooseModule.forRoot(process.env.MONGO_URI!),
    MongooseModule.forFeature([
      { name: 'Notification', schema: NotificationSchema },
    ]),
    SocketGatewayModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
