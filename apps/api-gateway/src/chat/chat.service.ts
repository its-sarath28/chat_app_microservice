import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { CHAT_TYPE, MEMBER_ROLE } from 'apps/chat/enum/chat.enum';
import { ConversationDocument } from 'apps/chat/schema/conversation.schema';

import { CHAT_CLIENT } from '@app/common/token/token';
import { PATTERN } from '@app/common/pattern/pattern';
import { CreateMessageDto } from '@app/common/dto/chat/chat.dto';

@Injectable()
export class ChatService {
  constructor(@Inject(CHAT_CLIENT) private chatClient: ClientProxy) {}

  // ========================
  // ======Conversation======
  // ========================
  getAllConversations(userId: number) {
    return this.chatClient.send(PATTERN.CHAT.GET_ALL_CONVERSATIONS, { userId });
  }

  async getConversation(conversationId: string, userId: number) {
    const isMember: boolean = await firstValueFrom(
      this.chatClient.send(PATTERN.CHAT.CHECK_IS_MEMBER, {
        conversationId: conversationId,
        memberId: userId,
      }),
    );

    if (!isMember) {
      throw new ForbiddenException("You'er not a member in this conversation");
    }

    return this.chatClient.send(PATTERN.CHAT.GET_CONVERSATION, {
      conversationId,
    });
  }

  // =========================
  // =========Message=========
  // =========================
  async sendMessage(data: CreateMessageDto, userId: number) {
    let conversationId: string = data.conversationId;

    if (conversationId === 'new') {
      const conversation: ConversationDocument = await firstValueFrom(
        this.chatClient.send(PATTERN.CHAT.CREATE_CONVERSATION, {
          type: CHAT_TYPE.DIRECT,
          createdBy: userId,
          members: [userId, data.receiver],
        }),
      );

      conversationId = conversation._id! as string;
    }

    return this.chatClient.send(PATTERN.CHAT.CREATE_MESSAGE, {
      ...data,
      conversationId,
    });
  }

  async getAllMessages(conversationId: string, userId: number) {
    const isMember: boolean = await firstValueFrom(
      this.chatClient.send(PATTERN.CHAT.CHECK_IS_MEMBER, {
        conversationId: conversationId,
        memberId: userId,
      }),
    );

    if (!isMember) {
      throw new ForbiddenException("You'er not a member in this conversation");
    }

    return this.chatClient.send(PATTERN.CHAT.GET_ALL_MESSAGES, {
      conversationId,
    });
  }

  async editMessage(data: any, userId: number) {
    const isMember: boolean = await firstValueFrom(
      this.chatClient.send(PATTERN.CHAT.CHECK_IS_MEMBER, {
        conversationId: data.conversationId,
        memberId: userId,
      }),
    );

    if (!isMember) {
      throw new ForbiddenException("You'er not a member in this conversation");
    }

    return this.chatClient.send(PATTERN.CHAT.EDIT_MESSAGE, data);
  }

  async deleteMessage(data: any, userId: number) {
    const isMember: boolean = await firstValueFrom(
      this.chatClient.send(PATTERN.CHAT.CHECK_IS_MEMBER, {
        conversationId: data.conversationId,
        memberId: userId,
      }),
    );

    if (!isMember) {
      throw new ForbiddenException("You'er not a member in this conversation");
    }

    return this.chatClient.send(PATTERN.CHAT.DELETE_MESSAGE, data);
  }

  // ==========================
  // ==========Member==========
  // ==========================
  async getMembers(conversationId: string, userId: number) {
    const isMember: boolean = await firstValueFrom(
      this.chatClient.send(PATTERN.CHAT.CHECK_IS_MEMBER, {
        conversationId,
        memberId: userId,
      }),
    );

    if (!isMember) {
      throw new ForbiddenException("You'er not a member in this conversation");
    }

    return this.chatClient.send(PATTERN.CHAT.GET_MEMBERS, {
      conversationId,
    });
  }

  async addMembers(
    conversationId: string,
    membersToAdd: number[],
    userId: number,
  ) {
    const isMember: boolean = await firstValueFrom(
      this.chatClient.send(PATTERN.CHAT.CHECK_IS_MEMBER, {
        conversationId,
        memberId: userId,
      }),
    );

    if (!isMember) {
      throw new ForbiddenException("You'er not a member in this conversation");
    }

    const memberRole: MEMBER_ROLE = await firstValueFrom(
      this.chatClient.send(PATTERN.CHAT.GET_MEMBER_ROLE, {
        conversationId,
        memberId: userId,
      }),
    );

    if (memberRole !== MEMBER_ROLE.ADMIN) {
      throw new ForbiddenException('Only Admin can add other members');
    }

    return this.chatClient.send(PATTERN.CHAT.ADD_MEMBERS, {
      conversationId,
      userId: membersToAdd,
    });
  }

  async removeMember(
    conversationId: string,
    memberToRemove: string,
    userId: number,
  ) {
    const isMember: boolean = await firstValueFrom(
      this.chatClient.send(PATTERN.CHAT.CHECK_IS_MEMBER, {
        conversationId,
        memberId: userId,
      }),
    );

    if (!isMember) {
      throw new ForbiddenException("You'er not a member in this conversation");
    }

    const memberRole: MEMBER_ROLE = await firstValueFrom(
      this.chatClient.send(PATTERN.CHAT.GET_MEMBER_ROLE, {
        conversationId,
        memberId: userId,
      }),
    );

    if (memberRole !== MEMBER_ROLE.ADMIN) {
      throw new ForbiddenException('Only Admin can remove other members');
    }

    return this.chatClient.send(PATTERN.CHAT.REMOVE_MEMBER, {
      conversationId,
      userId: memberToRemove,
    });
  }

  async changeMemberRole(data: any, userId: number) {
    const isMember: boolean = await firstValueFrom(
      this.chatClient.send(PATTERN.CHAT.CHECK_IS_MEMBER, {
        conversationId: data.conversationId,
        memberId: userId,
      }),
    );

    if (!isMember) {
      throw new ForbiddenException("You'er not a member in this conversation");
    }

    const memberRole: MEMBER_ROLE = await firstValueFrom(
      this.chatClient.send(PATTERN.CHAT.GET_MEMBER_ROLE, {
        conversationId: data.conversationId,
        memberId: userId,
      }),
    );

    if (memberRole !== MEMBER_ROLE.ADMIN) {
      throw new ForbiddenException('Only Admin can change other members role');
    }

    return this.chatClient.send(PATTERN.CHAT.CHANGE_MEMBER_ROLE, data);
  }
}
