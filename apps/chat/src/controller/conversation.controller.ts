import { Controller } from '@nestjs/common';
import { ConversationService } from '../service/conversation.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { CreateConversationDto } from '@app/common/dto/chat/chat.dto';
import { PATTERN } from '@app/common/pattern/pattern';

@Controller()
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @MessagePattern(PATTERN.CHAT.GET_ALL_CONVERSATIONS)
  getAllConversations(@Payload() data: { userId: number }) {
    return this.conversationService.getAllConversations(data.userId);
  }

  @MessagePattern(PATTERN.CHAT.GET_CONVERSATION)
  getConversation(@Payload() data: { conversationId: string; userId: number }) {
    return this.conversationService.getConversation(
      data.conversationId,
      data.userId,
    );
  }

  @EventPattern(PATTERN.CHAT.CREATE_CONVERSATION)
  createConversation(@Payload() data: CreateConversationDto) {
    return this.conversationService.createConversation(data);
  }
}
