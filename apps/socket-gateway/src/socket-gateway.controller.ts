import { Controller } from '@nestjs/common';
import { SocketGatewayService } from './socket-gateway.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { SOCKET_EVENT } from '@app/common/pattern/event';
import { PATTERN } from '@app/common/pattern/pattern';

@Controller()
export class SocketGatewayController {
  constructor(private readonly wsService: SocketGatewayService) {}

  @EventPattern(PATTERN.NOTIFICATION.NOTIFY_USER)
  handleNotification(
    @Payload() data: { userId: string; event: string; payload: any },
  ) {
    this.wsService.sendToUser(data.userId, data.event, data.payload);
  }
}
