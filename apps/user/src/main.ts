import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { UserModule } from './user.module';
import { USER_QUEUE } from '@app/common/token/token';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL!],
        queue: USER_QUEUE,
        queueOptions: { durable: true },
      },
    },
  );

  await app.listen();
}
bootstrap();
