import { NestFactory } from '@nestjs/core';
import { SocketGatewayModule } from './socket-gateway.module';
import { Transport } from '@nestjs/microservices';
import { SOCKET_QUEUE } from '@app/common/token/token';

async function bootstrap() {
  const app = await NestFactory.create(SocketGatewayModule);

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL!],
      queue: SOCKET_QUEUE,
      queueOptions: { durable: true },
    },
  });

  await app.startAllMicroservices();

  await app.listen(process.env.port ?? 3001);
}
bootstrap();
