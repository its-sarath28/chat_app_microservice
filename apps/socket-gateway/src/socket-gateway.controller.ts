import { Controller } from '@nestjs/common';
import { SocketGatewayService } from './socket-gateway.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERN } from '@app/common/pattern/pattern';
import { MESSAGE_TYPE } from 'apps/chat/enum/chat.enum';
import { NewMessagePayloadDto } from './dto/message.dto';

@Controller()
export class SocketGatewayController {
  constructor(private readonly wsService: SocketGatewayService) {}

  @MessagePattern(PATTERN.USER.GET_ONLINE_USERS)
  handleGetOnlineUsers() {
    return this.wsService.getOnlineUsers();
  }

  @EventPattern(PATTERN.NOTIFICATION.NOTIFY_USER)
  handleNotification(
    @Payload() data: { userId: string; event: string; payload: any },
  ) {
    this.wsService.sendToUser(data.userId, data.event, data.payload);
  }

  @EventPattern(PATTERN.MESSAGE.NEW_DIRECT_MESSAGE)
  async handleDirectMessage(@Payload() data: NewMessagePayloadDto) {
    console.log({ data });
    await this.wsService.sendDirectMessage(data.conversationId, data);
  }

  @EventPattern(PATTERN.MESSAGE.NEW_GROUP_MESSAGE)
  async handleGroupMessage(@Payload() data: NewMessagePayloadDto) {
    await this.wsService.sendGroupMessage(data.conversationId, data);
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
