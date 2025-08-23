import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SocketGateway } from './socket-gateway.gateway';
import { SocketGatewayService } from './socket-gateway.service';
import { SocketGatewayController } from './socket-gateway.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CHAT_CLIENT, CHAT_QUEUE } from '@app/common/token/token';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    JwtModule.register({}),
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
  ],
  controllers: [SocketGatewayController],
  providers: [SocketGateway, SocketGatewayService],
  exports: [SocketGatewayService],
})
export class SocketGatewayModule {}
