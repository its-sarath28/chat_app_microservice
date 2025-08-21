import mongoose, { Model } from 'mongoose';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Message } from '../schema/message.schema';
import {
  Conversation,
  ConversationDocument,
} from '../schema/conversation.schema';
import { Member } from '../schema/member.schema';

import {
  CreateConversationDto,
  CreateMessageDto,
} from '@app/common/dto/chat/chat.dto';
import { MEMBER_ROLE } from '../enum/chat.enum';
import { USER_CLIENT } from '@app/common/token/token';
import { ClientProxy } from '@nestjs/microservices';
import { PATTERN } from '@app/common/pattern/pattern';
import { User } from 'apps/user/entity/user.entity';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Member.name) private memberModel: Model<Member>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Conversation.name) private converModel: Model<Conversation>,
    @Inject(USER_CLIENT) private userClient: ClientProxy,
  ) {}

  // ========================
  // ======Conversation======
  // ========================
  async createConversation(data: CreateConversationDto) {
    const newConver: ConversationDocument = await this.converModel.create({
      type: data.type,
      createdBy: data.createdBy,
      createdOn: new Date(),
      groupName: data.groupName ?? null,
    });

    const members = data.members.map((member) => ({
      conversationId: newConver._id,
      userId: member,
      role:
        data.type === 'Group'
          ? member === data.createdBy
            ? MEMBER_ROLE.ADMIN
            : MEMBER_ROLE.MEMBER
          : MEMBER_ROLE.MEMBER,
    }));

    await this.memberModel.insertMany(members);

    return newConver;
  }

  async getConversation(id: string) {
    const conver: Conversation | null = await this.converModel.findById(id);

    if (!conver) throw new NotFoundException('Conversation not found');

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

    const conversations = await this.converModel
      .find({
        _id: { $in: objectIds },
      })
      .sort({ lastMessageAt: -1 });

    return conversations;
  }

  async updateLastMessage(conversationId: string, message: string) {
    const updated = await this.converModel.findByIdAndUpdate(
      conversationId,
      { $set: { lastMessageAt: new Date(), lastMessage: message } },
      { new: true, upsert: true },
    );

    if (!updated)
      throw new NotFoundException('Conversation to update not found');
  }

  async checkConversationExists(conversationId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new NotFoundException('Invalid conversation ID');
    }

    const exists = await this.converModel.exists({
      _id: new mongoose.Types.ObjectId(conversationId),
    });

    if (!exists) {
      throw new NotFoundException('Conversation not found');
    }
  }

  // =========================
  // =========Message=========
  // =========================
  async createMessage(data: CreateMessageDto) {
    // TODO: Upload media and get url

    const newMessage = await this.messageModel.create(data);

    // TODO: Send message in real-time
    // TODO: Send message notification

    await this.updateLastMessage(data.conversationId, data.text || ' ');

    return newMessage;
  }

  async getAllMessages(conversationId: string) {
    await this.checkConversationExists(conversationId);

    const messages = await this.messageModel
      .find({ conversationId })
      .sort({ createdAt: -1 });

    return messages;
  }

  async editMessage(messageId: string, message: string) {
    const updatedMessage: Message | null =
      await this.messageModel.findByIdAndUpdate(
        messageId,
        { $set: { text: message, isEdited: true } },
        { new: true, upsert: true },
      );

    if (!updatedMessage)
      throw new NotFoundException('Message to update not found');

    return { success: true, data: updatedMessage };
  }

  async deleteMessage(messageIds: string[]) {
    const result = await this.messageModel.updateMany(
      { _id: { $in: messageIds } },
      { $set: { isDeleted: true } },
    );

    return result;
  }

  // ==========================
  // ==========Member==========
  // ==========================
  async getMembers(conversationId: string) {
    await this.checkConversationExists(conversationId);

    const members: Member[] = await this.memberModel.find({ conversationId });

    const formatted = members.map(async (member: Member) => {
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
      };
    });

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
      throw new BadRequestException("Some user id's are invalid");
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

    if (!removed) throw new NotFoundException('Member to remove not found');

    return { success: true, message: 'Member removed successfully' };
  }

  async getMemberRole(conversationId: string, memberId: string) {
    await this.checkConversationExists(conversationId);

    const member: Member | null = await this.memberModel.findById(memberId);

    if (!member) throw new NotFoundException('Member not found');

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
      throw new NotFoundException('Member to update not found');
    }

    return { success: true, message: 'Member role updated successfully' };
  }

  async checkIsMember(conversationId: string, memberId: number) {
    const member: Member | null = await this.memberModel.findOne({
      conversationId,
      userId: memberId,
    });

    if (!member) return false;

    return true;
  }
}
