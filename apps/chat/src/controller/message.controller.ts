import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateMessageDto } from '@app/common/dto/chat/chat.dto';
import { PATTERN } from '@app/common/pattern/pattern';
import { MessageService } from '../service/message.service';

@Controller()
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @MessagePattern(PATTERN.CHAT.CREATE_MESSAGE)
  createMessage(@Payload() data: CreateMessageDto) {
    return this.messageService.createMessage(data);
  }

  @MessagePattern(PATTERN.CHAT.GET_ALL_MESSAGES)
  getAllMessages(@Payload() data: { conversationId: string }) {
    return this.messageService.getAllMessages(data.conversationId);
  }

  @MessagePattern(PATTERN.CHAT.GET_MESSAGE)
  getMessages(@Payload() data: { messageId: string }) {
    return this.messageService.getMessage(data.messageId);
  }

  @MessagePattern(PATTERN.CHAT.EDIT_MESSAGE)
  editMessage(@Payload() data: any) {
    return this.messageService.editMessage(data.messageId, data.message);
  }

  @MessagePattern(PATTERN.CHAT.DELETE_MESSAGE)
  deleteMessage(@Payload() data: { messageIds: string[]; userId: number }) {
    return this.messageService.deleteMessage(data.messageIds, data.userId);
  }
}
