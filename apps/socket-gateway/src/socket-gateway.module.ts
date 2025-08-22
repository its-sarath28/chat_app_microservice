import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SocketGateway } from './socket-gateway.gateway';
import { SocketGatewayService } from './socket-gateway.service';
import { SocketGatewayController } from './socket-gateway.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    JwtModule.register({}),
  ],
  controllers: [SocketGatewayController],
  providers: [SocketGateway, SocketGatewayService],
  exports: [SocketGatewayService],
})
export class SocketGatewayModule {}
