import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ApiGatewayController } from './api-gateway.controller';

import { ApiGatewayService } from './api-gateway.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
  ],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule {}
