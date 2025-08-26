import { Controller } from '@nestjs/common';
import { ChatService } from './chat.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERN } from '@app/common/pattern/pattern';
import {
  CreateConversationDto,
  CreateMessageDto,
} from '@app/common/dto/chat/chat.dto';
import { MEMBER_ROLE } from '../enum/chat.enum';

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ========================
  // ======Conversation======
  // ========================
  @MessagePattern(PATTERN.CHAT.GET_ALL_CONVERSATIONS)
  getAllConversations(@Payload() data: { userId: number }) {
    return this.chatService.getAllConversations(data.userId);
  }

  @MessagePattern(PATTERN.CHAT.GET_CONVERSATION)
  getConversation(@Payload() data: { conversationId: string; userId: number }) {
    return this.chatService.getConversation(data.conversationId, data.userId);
  }

  @EventPattern(PATTERN.CHAT.CREATE_CONVERSATION)
  createConversation(@Payload() data: CreateConversationDto) {
    return this.chatService.createConversation(data);
  }

  // =========================
  // =========Message=========
  // =========================
  @MessagePattern(PATTERN.CHAT.CREATE_MESSAGE)
  createMessage(@Payload() data: CreateMessageDto) {
    return this.chatService.createMessage(data);
  }

  @MessagePattern(PATTERN.CHAT.GET_ALL_MESSAGES)
  getAllMessages(@Payload() data: { conversationId: string }) {
    return this.chatService.getAllMessages(data.conversationId);
  }

  @MessagePattern(PATTERN.CHAT.GET_MESSAGE)
  getMessages(@Payload() data: { messageId: string }) {
    return this.chatService.getMessage(data.messageId);
  }

  @MessagePattern(PATTERN.CHAT.EDIT_MESSAGE)
  editMessage(@Payload() data: any) {
    return this.chatService.editMessage(data.messageId, data.message);
  }

  @MessagePattern(PATTERN.CHAT.DELETE_MESSAGE)
  deleteMessage(@Payload() data: { messageIds: string[]; userId: number }) {
    return this.chatService.deleteMessage(data.messageIds, data.userId);
  }

  // ==========================
  // ==========Member==========
  // ==========================
  @MessagePattern(PATTERN.CHAT.GET_MEMBERS)
  getMembers(@Payload() conversationId: string) {
    return this.chatService.getMembers(conversationId);
  }

  @MessagePattern(PATTERN.CHAT.ADD_MEMBERS)
  addMembers(@Payload() data: { conversationId: string; userIds: number[] }) {
    return this.chatService.addMembers(data.conversationId, data.userIds);
  }

  @MessagePattern(PATTERN.CHAT.REMOVE_MEMBER)
  removeMember(@Payload() data: { conversationId: string; memberId: string }) {
    return this.chatService.removeMember(data.conversationId, data.memberId);
  }

  @MessagePattern(PATTERN.CHAT.GET_MEMBER_ROLE)
  getMemberRole(@Payload() data: { conversationId: string; memberId: string }) {
    return this.chatService.getMemberRole(data.conversationId, data.memberId);
  }

  @MessagePattern(PATTERN.CHAT.CHANGE_MEMBER_ROLE)
  changeMemberRole(
    @Payload()
    data: {
      conversationId: string;
      memberId: string;
      newRole: MEMBER_ROLE;
    },
  ) {
    return this.chatService.changeMemberRole(
      data.conversationId,
      data.memberId,
      data.newRole,
    );
  }

  @MessagePattern(PATTERN.CHAT.CHECK_IS_MEMBER)
  checkIsMember(@Payload() data: { conversationId: string; memberId: number }) {
    return this.chatService.checkIsMember(data.conversationId, data.memberId);
  }
}
