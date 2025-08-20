import { NestFactory } from '@nestjs/core';
import { ChatModule } from './chat.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CHAT_QUEUE } from '@app/common/token/token';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ChatModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL!],
        queue: CHAT_QUEUE,
        queueOptions: { durable: true },
      },
    },
  );

  await app.listen();
}
bootstrap();
