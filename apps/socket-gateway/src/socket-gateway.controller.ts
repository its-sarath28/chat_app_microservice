import { Controller } from '@nestjs/common';
import { SocketGatewayService } from './socket-gateway.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PATTERN } from '@app/common/pattern/pattern';
import { MESSAGE_TYPE } from 'apps/chat/enum/chat.enum';

@Controller()
export class SocketGatewayController {
  constructor(private readonly wsService: SocketGatewayService) {}

  @EventPattern(PATTERN.NOTIFICATION.NOTIFY_USER)
  handleNotification(
    @Payload() data: { userId: string; event: string; payload: any },
  ) {
    this.wsService.sendToUser(data.userId, data.event, data.payload);
  }

  @EventPattern(PATTERN.CHAT.NEW_MESSAGE)
  handleNewMessage(
    @Payload()
    data: {
      conversationId: string;
      event: string;
      payload: {
        conversationId: string;
        messageId: string;
        sender: number;
        messageType: MESSAGE_TYPE;
        mediaUrl?: string;
        text?: string;
      };
    },
  ) {
    console.log(data);
    this.wsService.sendToRoom(data.conversationId, data.event, data.payload);
  }

  @EventPattern(PATTERN.CHAT.EDIT_MESSAGE)
  handleEditMessage(
    @Payload()
    data: {
      conversationId: string;
      event: string;
      payload: {
        sender: number;
        messageType: MESSAGE_TYPE;
        mediaUrl?: string;
        text?: string;
      };
    },
  ) {
    this.wsService.sendToRoom(data.conversationId, data.event, data.payload);
  }

  @EventPattern(PATTERN.CHAT.DELETE_MESSAGE)
  handleDeleteMessage(
    @Payload()
    data: {
      conversationId: string;
      event: string;
      payload: {
        sender: number;
        messageType: MESSAGE_TYPE;
        mediaUrl?: string;
        text?: string;
      };
    },
  ) {
    this.wsService.sendToRoom(data.conversationId, data.event, data.payload);
  }
}
