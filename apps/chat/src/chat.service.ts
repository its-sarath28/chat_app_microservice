import mongoose, { Model, Types } from 'mongoose';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Message, MessageDocument } from '../schema/message.schema';
import {
  Conversation,
  ConversationDocument,
} from '../schema/conversation.schema';
import { Member, MemberDocument } from '../schema/member.schema';

import {
  CreateConversationDto,
  CreateMessageDto,
} from '@app/common/dto/chat/chat.dto';
import { CHAT_TYPE, MEMBER_ROLE } from '../enum/chat.enum';
import { SOCKET_CLIENT, USER_CLIENT } from '@app/common/token/token';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PATTERN } from '@app/common/pattern/pattern';
import { User } from 'apps/user/entity/user.entity';
import { firstValueFrom } from 'rxjs';
import { SOCKET_EVENT } from '@app/common/pattern/event';
import { NewMessagePayloadDto } from 'apps/socket-gateway/src/dto/message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Member.name) private memberModel: Model<Member>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Conversation.name) private converModel: Model<Conversation>,
    @Inject(USER_CLIENT) private userClient: ClientProxy,
    @Inject(SOCKET_CLIENT) private wsClient: ClientProxy,
  ) {}

  // ========================
  // ======Conversation======
  // ========================
  async createConversation(data: CreateConversationDto) {
    const newConver: ConversationDocument = await this.converModel.create({
      type: data.type as CHAT_TYPE,
      createdBy: data.createdBy,
      createdOn: new Date(),
      groupName: data.groupName ?? null,
    });

    const members = data.members.map((member) => ({
      conversationId: newConver._id,
      userId: member,
      role:
        data.type === CHAT_TYPE.GROUP
          ? member === data.createdBy
            ? MEMBER_ROLE.ADMIN
            : MEMBER_ROLE.MEMBER
          : MEMBER_ROLE.MEMBER,
    }));

    await this.memberModel.insertMany(members);

    return newConver;
  }

  async getConversation(id: string, userId: number) {
    const conver: ConversationDocument | null =
      await this.converModel.findById(id);

    if (!conver) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Conversation not found',
      });
    }

    if (conver.type === CHAT_TYPE.DIRECT) {
      const otherMember: MemberDocument | null = await this.memberModel.findOne(
        {
          conversationId: new mongoose.Types.ObjectId(id),
          userId: { $ne: userId },
        },
      );

      const user: User | null = await firstValueFrom(
        this.userClient.send(PATTERN.USER.FIND_BY_ID, {
          userId: otherMember?.userId,
        }),
      );

      return {
        ...conver.toObject(),
        friendId: user?.id! as number,
        friendName: user?.fullName ?? 'Unknown',
        imageUrl: user?.imageUrl ?? null,
      };
    }

    return conver;
  }

  async getAllConversations(userId: number) {
    const memberDocs = await this.memberModel
      .find({ userId })
      .select('conversationId');

    const uniqueConversationIds = [
      ...new Set(memberDocs.map((doc) => doc.conversationId.toString())),
    ];

    const objectIds = uniqueConversationIds.map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    const conversations: ConversationDocument[] = await this.converModel
      .find({
        _id: { $in: objectIds },
      })
      .sort({ lastMessageAt: -1 });

    const formatted = await Promise.all(
      conversations.map(async (conv: ConversationDocument) => {
        if (conv.type === CHAT_TYPE.DIRECT) {
          const members = await this.memberModel.find({
            conversationId: new mongoose.Types.ObjectId(conv._id as string),
          });

          const otherMember: MemberDocument | undefined = members.find(
            (m) => m.userId !== userId,
          );

          if (!otherMember) return conv;

          const user: User | null = await firstValueFrom(
            this.userClient.send(PATTERN.USER.FIND_BY_ID, {
              userId: otherMember.userId,
            }),
          );

          return {
            ...conv.toObject(),
            friendName: user?.fullName ?? 'Unknown',
            imageUrl: user?.imageUrl ?? null,
          };
        } else {
          return {
            ...conv.toObject(),
            friendName: null,
            imageUrl: null,
          };
        }
      }),
    );

    return formatted;
  }

  async updateLastMessage(conversationId: string, message: string) {
    const updated = await this.converModel.findByIdAndUpdate(
      conversationId,
      { $set: { lastMessageAt: new Date(), lastMessage: message } },
      { new: true, upsert: true },
    );

    if (!updated)
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Conversation to update not found',
      });
  }

  async checkConversationExists(conversationId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Invalid conversation ID',
      });
    }

    const exists = await this.converModel.exists({
      _id: new mongoose.Types.ObjectId(conversationId),
    });

    if (!exists) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Conversation not found',
      });
    }
  }

  // =========================
  // =========Message=========
  // =========================
  async createMessage(data: CreateMessageDto) {
    // TODO: Handle medias

    const newMessage: MessageDocument = await this.messageModel.create(data);

    const conver: ConversationDocument | null = await this.converModel.findById(
      data.conversationId,
    );

    if (conver) {
      const pattern =
        conver?.type === CHAT_TYPE.DIRECT
          ? PATTERN.MESSAGE.NEW_DIRECT_MESSAGE
          : PATTERN.MESSAGE.NEW_GROUP_MESSAGE;

      this.wsClient.emit<NewMessagePayloadDto>(pattern, {
        conversationId: newMessage.conversationId,
        messageId: newMessage._id,
        sender: newMessage.sender,
        messageType: newMessage.type,
        mediaUrl: newMessage.mediaUrl,
        text: newMessage.text,
      });
    }

    await this.updateLastMessage(data.conversationId, data.text || ' ');

    return newMessage;
  }

  async getAllMessages(conversationId: string) {
    await this.checkConversationExists(conversationId);

    const messages = await this.messageModel
      .find({ conversationId })
      .sort({ createdAt: 1 });

    return messages;
  }

  async getMessage(messageId: string) {
    const message: Message | null = await this.messageModel.findById(messageId);

    if (!message) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Message not found',
      });
    }

    return message;
  }

  async editMessage(messageId: string, message: string) {
    const updatedMessage: Message | null =
      await this.messageModel.findByIdAndUpdate(
        messageId,
        { $set: { text: message, isEdited: true } },
        { new: true, upsert: true },
      );

    if (!updatedMessage) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Message to update not found',
      });
    }

    // this.wsClient.emit(PATTERN.CHAT.NEW_MESSAGE, {
    //   conversationId: updatedMessage.conversationId,
    //   event: SOCKET_EVENT.CHAT.UPDATE_MESSAGE,
    //   payload: {
    //     sender: updatedMessage.sender,
    //     messageType: updatedMessage.type,
    //     mediaUrl: updatedMessage.mediaUrl,
    //     text: updatedMessage.text,
    //   },
    // });

    return { success: true, data: updatedMessage };
  }

  async deleteMessage(messageIds: string[], userId: number) {
    const messages: Message[] = await this.messageModel.find({
      _id: { $in: messageIds },
      sender: userId,
    });

    if (messages.length !== messageIds.length) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Some messages are not found or not send by you',
      });
    }

    const result = await this.messageModel.updateMany(
      { _id: { $in: messageIds } },
      { $set: { isDeleted: true } },
    );

    this.wsClient.emit(PATTERN.CHAT.DELETE_MESSAGE, {
      conversationId: messages[0].conversationId,
      event: SOCKET_EVENT.CHAT.DELETE_MESSAGE,
      payload: {
        messageIds,
      },
    });

    return result;
  }

  // ==========================
  // ==========Member==========
  // ==========================
  async getMembers(conversationId: string) {
    await this.checkConversationExists(conversationId);

    const members: Member[] = await this.memberModel.find({
      conversationId: new mongoose.Types.ObjectId(conversationId),
    });

    const formatted = await Promise.all(
      members.map(async (member: Member) => {
        const user: User = await firstValueFrom(
          this.userClient.send(PATTERN.USER.GET_PROFILE, {
            userId: member.userId,
          }),
        );

        return {
          memberId: member._id,
          fullName: user.fullName,
          imageUrl: user.imageUrl ?? null,
          joinedOn: member.joinedOn,
          userId: member.userId,
        };
      }),
    );

    return formatted;
  }

  async addMembers(conversationId: string, userIds: number[]) {
    await this.checkConversationExists(conversationId);

    const validUserIds: number[] = [];
    const inValidUserIds: number[] = [];

    userIds.map(async (id) => {
      const user = await firstValueFrom(
        this.userClient.send(PATTERN.USER.GET_PROFILE, { userId: id }),
      );

      user ? validUserIds.push(id) : inValidUserIds.push(id);
    });

    if (inValidUserIds.length) {
      throw new RpcException({
        statusCode: HttpStatus.BAD_GATEWAY,
        message: `Some user id's are invalid`,
      });
    }

    const newMembers = validUserIds.map((user) => ({
      conversationId,
      userId: user,
      role: MEMBER_ROLE.MEMBER,
    }));

    await this.memberModel.insertMany(newMembers);

    return {
      success: true,
      message: `${validUserIds.length} members added to the group`,
    };
  }

  async removeMember(conversationId: string, memberId: string) {
    await this.checkConversationExists(conversationId);

    const removed = await this.memberModel.findByIdAndDelete(memberId);

    if (!removed) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Member to remove not found',
      });
    }

    return { success: true, message: 'Member removed successfully' };
  }

  async getMemberRole(conversationId: string, memberId: string) {
    await this.checkConversationExists(conversationId);

    const member: Member | null = await this.memberModel.findById(memberId);

    if (!member) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Member not found',
      });
    }

    return member.role;
  }

  async changeMemberRole(
    conversationId: string,
    memberId: string,
    newRole: MEMBER_ROLE,
  ) {
    await this.checkConversationExists(conversationId);

    const updated = await this.memberModel.findByIdAndUpdate(
      memberId,
      { $set: { role: newRole } },
      { new: true, upsert: true },
    );

    if (!updated) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Member to update not found',
      });
    }

    return { success: true, message: 'Member role updated successfully' };
  }

  async checkIsMember(conversationId: string, memberId: number) {
    const member: Member | null = await this.memberModel.findOne({
      conversationId: new Types.ObjectId(conversationId),
      userId: memberId,
    });

    if (!member) return false;

    return true;
  }
}
